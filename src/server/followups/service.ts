import { prisma } from "@/lib/db";
import { FollowUpBucket } from "@/types";
import { startOfDay, endOfDay, addDays } from "date-fns";
import { Prisma } from "@prisma/client";

export async function getFollowUps(
  businessId: number,
  bucket: FollowUpBucket = "today",
  options: { limit?: number; page?: number } = {}
) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrowStart = startOfDay(addDays(now, 1));
  const tomorrowEnd = endOfDay(addDays(now, 1));

  // Multi-tenant filter: only follow-ups where lead belongs to businessId
  const baseWhere: Prisma.FollowUpWhereInput = {
    lead: {
      businessId,
    },
  };

  const where: Prisma.FollowUpWhereInput = { ...baseWhere };

  switch (bucket) {
    case "overdue":
      where.status = "PENDING";
      where.scheduledAt = { lt: todayStart };
      break;
    case "today":
      where.status = "PENDING";
      where.scheduledAt = { gte: todayStart, lte: todayEnd };
      break;
    case "tomorrow":
      where.status = "PENDING";
      where.scheduledAt = { gte: tomorrowStart, lte: tomorrowEnd };
      break;
    case "upcoming":
      where.status = "PENDING";
      where.scheduledAt = { gt: tomorrowEnd };
      break;
    case "completed":
      where.status = "DONE";
      break;
  }

  // Count per bucket for UI tabs
  const [overdueCount, todayCount, tomorrowCount, upcomingCount, completedCount, followUps] =
    await Promise.all([
      prisma.followUp.count({
        where: {
          ...baseWhere,
          status: "PENDING",
          scheduledAt: { lt: todayStart },
        },
      }),
      prisma.followUp.count({
        where: {
          ...baseWhere,
          status: "PENDING",
          scheduledAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.followUp.count({
        where: {
          ...baseWhere,
          status: "PENDING",
          scheduledAt: { gte: tomorrowStart, lte: tomorrowEnd },
        },
      }),
      prisma.followUp.count({
        where: {
          ...baseWhere,
          status: "PENDING",
          scheduledAt: { gt: tomorrowEnd },
        },
      }),
      prisma.followUp.count({
        where: {
          ...baseWhere,
          status: "DONE",
        },
      }),
      prisma.followUp.findMany({
        where,
        orderBy: bucket === "completed" ? { completedAt: "desc" } : { scheduledAt: "asc" },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              phone: true,
              status: true,
              source: true,
              field1Value: true,
              field2Value: true,
              field3Value: true,
              field4Value: true,
            },
          },
          user: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

  return {
    followUps,
    counts: {
      overdue: overdueCount,
      today: todayCount,
      tomorrow: tomorrowCount,
      upcoming: upcomingCount,
      completed: completedCount,
      totalPending: overdueCount + todayCount + tomorrowCount + upcomingCount,
    },
  };
}

export async function createFollowUp(
  businessId: number,
  userId: number,
  data: {
    leadId: number;
    scheduledAt: Date | string;
    note?: string | null;
  }
) {
  // Ensure lead belongs to businessId
  const lead = await prisma.lead.findFirst({
    where: { id: data.leadId, businessId },
  });

  if (!lead) {
    throw new Error("Lead not found or access denied");
  }

  const scheduledDate = new Date(data.scheduledAt);

  const followUp = await prisma.followUp.create({
    data: {
      leadId: data.leadId,
      userId,
      scheduledAt: scheduledDate,
      note: data.note,
      status: "PENDING",
    },
  });

  // Update lead's nextFollowupAt if this is next in line or currently null
  await prisma.lead.update({
    where: { id: data.leadId },
    data: { nextFollowupAt: scheduledDate },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: data.leadId,
      userId,
      type: "NOTE",
      description: `Scheduled follow-up for ${scheduledDate.toLocaleString()}${
        data.note ? `: "${data.note}"` : ""
      }`,
    },
  });

  return followUp;
}

export async function completeFollowUp(
  businessId: number,
  userId: number,
  followUpId: number,
  data: {
    status?: "DONE" | "CANCELLED";
    note?: string | null;
    nextFollowupAt?: Date | string | null;
  }
) {
  // Ensure followUp exists and lead belongs to tenant
  const existing = await prisma.followUp.findFirst({
    where: {
      id: followUpId,
      lead: { businessId },
    },
    include: { lead: true },
  });

  if (!existing) {
    throw new Error("Follow-up not found or access denied");
  }

  const now = new Date();
  const status = data.status || "DONE";

  const updatedFollowUp = await prisma.followUp.update({
    where: { id: followUpId },
    data: {
      status,
      completedAt: now,
      note: data.note ? `${existing.note ? existing.note + " | " : ""}${data.note}` : existing.note,
    },
  });

  // Log activity
  await prisma.leadActivity.create({
    data: {
      leadId: existing.leadId,
      userId,
      type: "NOTE",
      description: `Follow-up marked as ${status}${data.note ? `: "${data.note}"` : ""}`,
    },
  });

  // Handle scheduling next follow up if provided
  if (data.nextFollowupAt) {
    const nextDate = new Date(data.nextFollowupAt);
    await prisma.followUp.create({
      data: {
        leadId: existing.leadId,
        userId,
        scheduledAt: nextDate,
        note: `Follow-up scheduled after completing previous follow-up`,
        status: "PENDING",
      },
    });

    await prisma.lead.update({
      where: { id: existing.leadId },
      data: { nextFollowupAt: nextDate },
    });
  } else {
    // Check if there are other pending follow-ups for this lead
    const nextPending = await prisma.followUp.findFirst({
      where: {
        leadId: existing.leadId,
        status: "PENDING",
      },
      orderBy: { scheduledAt: "asc" },
    });

    await prisma.lead.update({
      where: { id: existing.leadId },
      data: { nextFollowupAt: nextPending ? nextPending.scheduledAt : null },
    });
  }

  return updatedFollowUp;
}
