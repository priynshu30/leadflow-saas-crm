import { prisma } from "@/lib/db";
import { LeadStatus, Prisma } from "@prisma/client";

export interface LeadFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus;
  source?: string;
  assignedUserId?: number;
}

export async function getLeads(businessId: number, filters: LeadFilters = {}) {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, Math.min(100, filters.limit || 20));
  const skip = (page - 1) * limit;

  const where: Prisma.LeadWhereInput = {
    businessId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.source) {
    where.source = filters.source;
  }

  if (filters.assignedUserId) {
    where.assignedUserId = filters.assignedUserId;
  }

  if (filters.search && filters.search.trim() !== "") {
    const s = filters.search.trim();
    where.OR = [
      { name: { contains: s } },
      { phone: { contains: s } },
      { email: { contains: s } },
      { field1Value: { contains: s } },
      { field2Value: { contains: s } },
      { field3Value: { contains: s } },
      { field4Value: { contains: s } },
      { notes: { contains: s } },
    ];
  }

  const [total, leads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
  ]);

  return {
    leads,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getLeadById(businessId: number, leadId: number) {
  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      businessId, // Critical: tenant scoping
    },
    include: {
      assignedUser: {
        select: { id: true, name: true, email: true },
      },
      followUps: {
        orderBy: { scheduledAt: "desc" },
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  return lead;
}

export async function checkDuplicatePhone(businessId: number, phone: string, excludeLeadId?: number) {
  const cleaned = phone.replace(/\D/g, "");
  // Search for the phone matching exact or matching the last 10 digits
  const last10 = cleaned.slice(-10);

  const existing = await prisma.lead.findFirst({
    where: {
      businessId,
      phone: {
        contains: last10.length >= 7 ? last10 : cleaned,
      },
      ...(excludeLeadId ? { id: { not: excludeLeadId } } : {}),
    },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      createdAt: true,
    },
  });

  return existing;
}

export async function createLead(
  businessId: number,
  userId: number,
  data: {
    name: string;
    phone: string;
    email?: string | null;
    alternatePhone?: string | null;
    source?: string | null;
    status?: LeadStatus;
    field1Label?: string | null;
    field1Value?: string | null;
    field2Label?: string | null;
    field2Value?: string | null;
    field3Label?: string | null;
    field3Value?: string | null;
    field4Label?: string | null;
    field4Value?: string | null;
    notes?: string | null;
    nextFollowupAt?: Date | string | null;
    assignedUserId?: number | null;
  }
) {
  // If field labels aren't provided, fetch business default labels
  let field1Label = data.field1Label;
  let field2Label = data.field2Label;
  let field3Label = data.field3Label;
  let field4Label = data.field4Label;

  if (!field1Label || !field2Label || !field3Label || !field4Label) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        field1Label: true,
        field2Label: true,
        field3Label: true,
        field4Label: true,
      },
    });
    if (business) {
      field1Label = field1Label ?? business.field1Label;
      field2Label = field2Label ?? business.field2Label;
      field3Label = field3Label ?? business.field3Label;
      field4Label = field4Label ?? business.field4Label;
    }
  }

  const nextFollowupDate = data.nextFollowupAt ? new Date(data.nextFollowupAt) : null;

  const lead = await prisma.lead.create({
    data: {
      businessId,
      assignedUserId: data.assignedUserId ?? userId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      alternatePhone: data.alternatePhone,
      source: data.source || "Direct Call",
      status: data.status || "NEW",
      field1Label,
      field1Value: data.field1Value,
      field2Label,
      field2Value: data.field2Value,
      field3Label,
      field3Value: data.field3Value,
      field4Label,
      field4Value: data.field4Value,
      notes: data.notes,
      nextFollowupAt: nextFollowupDate,
    },
  });

  // Always log LEAD_CREATED activity
  await prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      userId,
      type: "LEAD_CREATED",
      description: `Lead created with status "${lead.status}" from source "${lead.source}".`,
    },
  });

  // If follow-up date was set, create scheduled follow-up entry
  if (nextFollowupDate) {
    await prisma.followUp.create({
      data: {
        leadId: lead.id,
        userId,
        scheduledAt: nextFollowupDate,
        note: data.notes ? `Initial follow-up: ${data.notes.slice(0, 100)}` : "Initial scheduled follow-up",
      },
    });
  }

  return lead;
}

export async function updateLead(
  businessId: number,
  userId: number,
  leadId: number,
  data: Prisma.LeadUpdateInput & { nextFollowupAt?: string | Date | null }
) {
  // Ensure lead belongs to tenant
  const existing = await prisma.lead.findFirst({
    where: { id: leadId, businessId },
  });

  if (!existing) {
    throw new Error("Lead not found or access denied");
  }

  const updateData: Prisma.LeadUpdateInput = { ...data };
  if (data.nextFollowupAt !== undefined) {
    updateData.nextFollowupAt = data.nextFollowupAt ? new Date(data.nextFollowupAt as string) : null;
  }

  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: updateData,
  });

  // If status changed, log activity
  if (data.status && data.status !== existing.status) {
    await prisma.leadActivity.create({
      data: {
        leadId,
        userId,
        type: "STATUS_CHANGE",
        description: `Status changed from ${existing.status} to ${data.status}`,
      },
    });
  }

  return updatedLead;
}

export async function deleteLead(businessId: number, leadId: number) {
  const existing = await prisma.lead.findFirst({
    where: { id: leadId, businessId },
  });

  if (!existing) {
    throw new Error("Lead not found or access denied");
  }

  // Delete relations first
  await prisma.leadActivity.deleteMany({ where: { leadId } });
  await prisma.followUp.deleteMany({ where: { leadId } });
  return prisma.lead.delete({ where: { id: leadId } });
}
