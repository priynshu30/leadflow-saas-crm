import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from "date-fns";

export async function getDashboardStats(businessId: number) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const sevenDaysAgo = subDays(now, 6);

  const [
    totalLeads,
    newLeads,
    interestedLeads,
    convertedLeads,
    overdueFollowUps,
    todayFollowUps,
    recentLeads,
    urgentFollowUps,
    recentWeekLeads,
  ] = await Promise.all([
    // Total leads for this tenant
    prisma.lead.count({ where: { businessId } }),
    // New status leads
    prisma.lead.count({ where: { businessId, status: "NEW" } }),
    // Interested / active pipeline
    prisma.lead.count({
      where: {
        businessId,
        status: { in: ["INTERESTED", "FOLLOW_UP", "SITE_VISIT"] },
      },
    }),
    // Converted leads
    prisma.lead.count({ where: { businessId, status: "CONVERTED" } }),
    // Overdue followups
    prisma.followUp.count({
      where: {
        lead: { businessId },
        status: "PENDING",
        scheduledAt: { lt: todayStart },
      },
    }),
    // Today followups
    prisma.followUp.count({
      where: {
        lead: { businessId },
        status: "PENDING",
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    // 6 Most recently updated leads
    prisma.lead.findMany({
      where: { businessId },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        assignedUser: { select: { name: true } },
      },
    }),
    // 6 Most urgent followups due
    prisma.followUp.findMany({
      where: {
        lead: { businessId },
        status: "PENDING",
        scheduledAt: { lte: todayEnd },
      },
      orderBy: { scheduledAt: "asc" },
      take: 6,
      include: {
        lead: {
          select: { id: true, name: true, phone: true, status: true, source: true },
        },
      },
    }),
    // 7-day lead data for dashboard mini-trend
    prisma.lead.findMany({
      where: {
        businessId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true, status: true },
    }),
  ]);

  const last7Days = eachDayOfInterval({
    start: sevenDaysAgo,
    end: now,
  });

  const weeklyTrend = last7Days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const label = format(day, "EEE");
    const count = recentWeekLeads.filter(
      (l) => format(new Date(l.createdAt), "yyyy-MM-dd") === dayStr
    ).length;
    const converted = recentWeekLeads.filter(
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

  return {
    stats: {
      totalLeads,
      newLeads,
      interestedLeads,
      convertedLeads,
      followUpsDue: overdueFollowUps + todayFollowUps,
      overdueFollowUps,
      todayFollowUps,
    },
    weeklyTrend,
    recentLeads,
    urgentFollowUps,
  };
}
