import { prisma } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

export async function getNotifications(businessId: number, userId: number) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // 1. Fetch DB notifications
  const dbNotifications = await prisma.notification.findMany({
    where: { businessId, userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // 2. Fetch real-time active system alerts (overdue follow-ups & today follow-ups)
  const [overdueCount, todayCount] = await Promise.all([
    prisma.followUp.count({
      where: {
        lead: { businessId },
        status: "PENDING",
        scheduledAt: { lt: todayStart },
      },
    }),
    prisma.followUp.count({
      where: {
        lead: { businessId },
        status: "PENDING",
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
    }),
  ]);

  const unreadCount =
    dbNotifications.filter((n) => !n.read).length +
    (overdueCount > 0 ? 1 : 0) +
    (todayCount > 0 ? 1 : 0);

  return {
    notifications: dbNotifications,
    systemAlerts: {
      overdueFollowUps: overdueCount,
      todayFollowUps: todayCount,
    },
    unreadCount,
  };
}

export async function markNotificationRead(
  businessId: number,
  userId: number,
  notificationId: number
) {
  return prisma.notification.updateMany({
    where: { id: notificationId, businessId, userId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(
  businessId: number,
  userId: number
) {
  return prisma.notification.updateMany({
    where: { businessId, userId, read: false },
    data: { read: true },
  });
}
