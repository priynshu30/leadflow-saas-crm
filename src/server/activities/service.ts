import { prisma } from "@/lib/db";

export async function getActivities(businessId: number, leadId: number) {
  // Ensure lead belongs to businessId
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, businessId },
  });

  if (!lead) {
    throw new Error("Lead not found or access denied");
  }

  return prisma.leadActivity.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function createActivity(
  businessId: number,
  userId: number,
  data: {
    leadId: number;
    type: "CALL" | "WHATSAPP" | "EMAIL" | "STATUS_CHANGE" | "NOTE" | "LEAD_CREATED";
    description: string;
  }
) {
  const lead = await prisma.lead.findFirst({
    where: { id: data.leadId, businessId },
  });

  if (!lead) {
    throw new Error("Lead not found or access denied");
  }

  return prisma.leadActivity.create({
    data: {
      leadId: data.leadId,
      userId,
      type: data.type,
      description: data.description,
    },
  });
}
