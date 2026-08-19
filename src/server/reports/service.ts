import { prisma } from "@/lib/db";
import { LeadStatus } from "@prisma/client";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";

export async function getReports(businessId: number) {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sevenDaysAgo = subDays(now, 7);

  const [leads, sourcesRaw, activities, followUps] = await Promise.all([
    prisma.lead.findMany({
      where: { businessId },
      select: {
        id: true,
        status: true,
        source: true,
        createdAt: true,
        field1Value: true,
      },
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: { businessId },
      _count: { id: true },
    }),
    prisma.leadActivity.findMany({
      where: { lead: { businessId }, createdAt: { gte: thirtyDaysAgo } },
      select: { type: true, createdAt: true },
    }),
    prisma.followUp.findMany({
      where: { lead: { businessId } },
      select: { status: true, completedAt: true, scheduledAt: true },
    }),
  ]);

  const totalLeads = leads.length;

  const statusCounts: Record<LeadStatus, number> = {
    NEW: 0,
    CONTACTED: 0,
    INTERESTED: 0,
    FOLLOW_UP: 0,
    SITE_VISIT: 0,
    CONVERTED: 0,
    LOST: 0,
  };

  leads.forEach((l) => {
    if (statusCounts[l.status] !== undefined) {
      statusCounts[l.status]++;
    }
  });

  const convertedCount = statusCounts.CONVERTED;
  const lostCount = statusCounts.LOST;
  const closedCount = convertedCount + lostCount;
  const conversionRate =
    closedCount > 0
      ? Math.round((convertedCount / closedCount) * 100)
      : totalLeads > 0
      ? Math.round((convertedCount / totalLeads) * 100)
      : 0;

  // 1. Leads by Acquisition Source
  const leadsBySource = sourcesRaw.map((s) => ({
    source: s.source || "Direct Call",
    count: s._count.id,
  }));

  // 2. 14-Day Daily Lead Growth Trend
  const last14Days = eachDayOfInterval({
    start: subDays(now, 13),
    end: now,
  });

  const leadTrends = last14Days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const label = format(day, "MMM dd");
    const count = leads.filter(
      (l) => format(new Date(l.createdAt), "yyyy-MM-dd") === dayStr
    ).length;
    const converted = leads.filter(
      (l) =>
        l.status === "CONVERTED" &&
        format(new Date(l.createdAt), "yyyy-MM-dd") === dayStr
    ).length;

    return {
      date: label,
      leads: count,
      converted,
    };
  });

  // 3. Weekly Activity Breakdown (Call vs WhatsApp vs Notes)
  const last7Days = eachDayOfInterval({
    start: subDays(now, 6),
    end: now,
  });

  const activityTrends = last7Days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const label = format(day, "EEE (d)");
    const calls = activities.filter(
      (a) =>
        a.type === "CALL" && format(new Date(a.createdAt), "yyyy-MM-dd") === dayStr
    ).length;
    const whatsapp = activities.filter(
      (a) =>
        a.type === "WHATSAPP" &&
        format(new Date(a.createdAt), "yyyy-MM-dd") === dayStr
    ).length;
    const notes = activities.filter(
      (a) =>
        (a.type === "NOTE" || a.type === "STATUS_CHANGE") &&
        format(new Date(a.createdAt), "yyyy-MM-dd") === dayStr
    ).length;

    return {
      day: label,
      Calls: calls,
      WhatsApp: whatsapp,
      Notes: notes,
      Total: calls + whatsapp + notes,
    };
  });

  // 4. Sales Funnel Step Progression
  const funnelStages = [
    { stage: "Total Enquiries", count: totalLeads, color: "#6366F1" },
    {
      stage: "Contacted",
      count:
        totalLeads - statusCounts.NEW > 0
          ? totalLeads - statusCounts.NEW
          : statusCounts.CONTACTED,
      color: "#3B82F6",
    },
    {
      stage: "Interested / Active",
      count: statusCounts.INTERESTED + statusCounts.FOLLOW_UP + statusCounts.SITE_VISIT + statusCounts.CONVERTED,
      color: "#10B981",
    },
    {
      stage: "Site Visit / Meeting",
      count: statusCounts.SITE_VISIT + statusCounts.CONVERTED,
      color: "#F59E0B",
    },
    { stage: "Won / Converted", count: statusCounts.CONVERTED, color: "#059669" },
  ];

  return {
    totalLeads,
    convertedCount,
    lostCount,
    conversionRate,
    statusCounts,
    leadsBySource,
    leadTrends,
    activityTrends,
    funnelStages,
  };
}
