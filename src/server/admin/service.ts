import { prisma } from "@/lib/db";
import { subDays, startOfDay, endOfDay } from "date-fns";

export async function getAdminStats() {
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const dayAgo = subDays(now, 1);

  const [
    totalBusinesses,
    totalUsers,
    signupsThisWeek,
    activeTodayLogins,
    businessesByPlan,
    recentLogins,
  ] = await Promise.all([
    prisma.business.count(),
    prisma.user.count(),
    prisma.business.count({
      where: { createdAt: { gte: weekAgo } },
    }),
    prisma.loginLog.findMany({
      where: {
        success: true,
        createdAt: { gte: dayAgo },
        businessId: { not: null },
      },
      select: { businessId: true, userId: true },
    }),
    prisma.business.groupBy({
      by: ["plan"],
      _count: { id: true },
    }),
    prisma.loginLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        business: { select: { name: true, status: true } },
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const uniqueActiveBusinessesToday = new Set(
    activeTodayLogins.map((l) => l.businessId).filter(Boolean)
  ).size;
  const uniqueActiveUsersToday = new Set(
    activeTodayLogins.map((l) => l.userId).filter(Boolean)
  ).size;

  const planCounts: Record<string, number> = {
    FREE: 0,
    STARTER: 0,
    PRO: 0,
    ENTERPRISE: 0,
  };
  businessesByPlan.forEach((b) => {
    const key = (b.plan || "FREE").toUpperCase();
    planCounts[key] = (planCounts[key] || 0) + b._count.id;
  });

  return {
    totalBusinesses,
    totalUsers,
    signupsThisWeek,
    activeToday: {
      businesses: uniqueActiveBusinessesToday,
      users: uniqueActiveUsersToday,
    },
    planCounts,
    recentLogins,
  };
}

export async function getAdminBusinesses(options: {
  search?: string;
  plan?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 25));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (options.status && options.status !== "ALL") {
    where.status = options.status;
  }

  if (options.plan && options.plan !== "ALL") {
    where.plan = options.plan;
  }

  if (options.search && options.search.trim()) {
    const s = options.search.trim();
    where.OR = [
      { name: { contains: s } },
      { email: { contains: s } },
      { phone: { contains: s } },
    ];
  }

  const [businesses, total] = await Promise.all([
    prisma.business.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            users: true,
            leads: true,
          },
        },
        users: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: { name: true, email: true },
        },
        loginLogs: {
          where: { success: true },
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        },
      },
    }),
    prisma.business.count({ where }),
  ]);

  const items = businesses.map((b) => ({
    id: b.id,
    name: b.name,
    email: b.email,
    phone: b.phone,
    businessType: b.businessType,
    status: b.status,
    plan: b.plan,
    userCount: b._count.users,
    leadCount: b._count.leads,
    owner: b.users[0] || null,
    lastLoginAt: b.loginLogs[0]?.createdAt || null,
    createdAt: b.createdAt,
  }));

  return {
    businesses: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAdminBusinessById(id: number) {
  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          leads: true,
          users: true,
        },
      },
      users: {
        orderBy: { createdAt: "asc" },
        include: {
          loginLogs: {
            where: { success: true },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
          _count: {
            select: {
              loginLogs: { where: { success: true } },
              leads: true,
            },
          },
        },
      },
    },
  });

  if (!business) return null;

  return {
    id: business.id,
    name: business.name,
    email: business.email,
    phone: business.phone,
    address: business.address,
    businessType: business.businessType,
    status: business.status,
    plan: business.plan,
    totalLeads: business._count.leads,
    totalUsers: business._count.users,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
    users: business.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      totalLogins: u._count.loginLogs,
      assignedLeads: u._count.leads,
      lastLoginAt: u.loginLogs[0]?.createdAt || null,
      createdAt: u.createdAt,
    })),
  };
}

export async function updateAdminBusiness(
  id: number,
  data: { status?: "ACTIVE" | "SUSPENDED"; plan?: string }
) {
  const updateData: any = {};
  if (data.status) updateData.status = data.status;
  if (data.plan) updateData.plan = data.plan.toUpperCase();

  return prisma.business.update({
    where: { id },
    data: updateData,
  });
}

export async function getAdminUsers(options: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 25));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (options.search && options.search.trim()) {
    const s = options.search.trim();
    where.OR = [
      { name: { contains: s } },
      { email: { contains: s } },
      { phone: { contains: s } },
      { business: { name: { contains: s } } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        business: {
          select: { id: true, name: true, status: true, plan: true },
        },
        loginLogs: {
          where: { success: true },
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        },
        _count: {
          select: {
            loginLogs: { where: { success: true } },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const items = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    businessId: u.business.id,
    businessName: u.business.name,
    businessStatus: u.business.status,
    businessPlan: u.business.plan,
    totalLogins: u._count.loginLogs,
    lastLoginAt: u.loginLogs[0]?.createdAt || null,
    createdAt: u.createdAt,
  }));

  return {
    users: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAdminLogins(options: {
  businessId?: number;
  from?: string;
  to?: string;
  success?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 50));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (options.businessId) {
    where.businessId = options.businessId;
  }

  if (options.success !== undefined) {
    where.success = options.success;
  }

  if (options.from || options.to) {
    where.createdAt = {};
    if (options.from) where.createdAt.gte = startOfDay(new Date(options.from));
    if (options.to) where.createdAt.lte = endOfDay(new Date(options.to));
  }

  if (options.search && options.search.trim()) {
    const s = options.search.trim();
    where.OR = [
      { email: { contains: s } },
      { ipAddress: { contains: s } },
      { business: { name: { contains: s } } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.loginLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        business: { select: { id: true, name: true, status: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.loginLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
