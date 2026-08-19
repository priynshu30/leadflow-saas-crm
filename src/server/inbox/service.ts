import { prisma } from "@/lib/db";

export async function getEmailMessages(
  businessId: number,
  options: { status?: string; search?: string } = {}
) {
  const where: any = { businessId };
  if (options.status && options.status !== "ALL") {
    where.status = options.status;
  }

  if (options.search && options.search.trim()) {
    const s = options.search.trim();
    where.OR = [
      { subject: { contains: s } },
      { body: { contains: s } },
      { fromEmail: { contains: s } },
      { fromName: { contains: s } },
    ];
  }

  const [messages, unreadCount] = await Promise.all([
    prisma.emailMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
            field1Value: true,
          },
        },
      },
    }),
    prisma.emailMessage.count({
      where: { businessId, status: "UNREAD" },
    }),
  ]);

  return {
    messages,
    unreadCount,
  };
}

export async function getEmailMessageById(businessId: number, id: number) {
  const message = await prisma.emailMessage.findFirst({
    where: { id, businessId },
    include: {
      lead: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          status: true,
          field1Value: true,
          field2Value: true,
        },
      },
    },
  });

  if (message && message.status === "UNREAD") {
    await prisma.emailMessage.update({
      where: { id },
      data: { status: "READ" },
    });
  }

  return message;
}

export async function replyToEmailMessage(
  businessId: number,
  userId: number,
  data: {
    messageId: number;
    replyBody: string;
    subject?: string;
  }
) {
  const original = await prisma.emailMessage.findFirst({
    where: { id: data.messageId, businessId },
  });

  if (!original) {
    throw new Error("Message not found");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  // 1. Create outbound email record
  const outbound = await prisma.emailMessage.create({
    data: {
      businessId,
      leadId: original.leadId,
      fromEmail: user?.email || "team@leadflow.in",
      fromName: user?.name || "CRM Agent",
      toEmail: original.fromEmail,
      subject: data.subject || `Re: ${original.subject}`,
      body: data.replyBody,
      direction: "OUTBOUND",
      status: "REPLIED",
    },
  });

  // 2. Mark original message as REPLIED
  await prisma.emailMessage.update({
    where: { id: data.messageId },
    data: { status: "REPLIED" },
  });

  // 3. Log lead activity if linked to lead
  if (original.leadId) {
    await prisma.leadActivity.create({
      data: {
        leadId: original.leadId,
        userId,
        type: "EMAIL",
        description: `Replied to Email "${original.subject}":\n"${data.replyBody}"`,
      },
    });
  }

  return outbound;
}
