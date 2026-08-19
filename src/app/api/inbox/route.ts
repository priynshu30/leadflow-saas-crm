import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getEmailMessages } from "@/server/inbox/service";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search") || "";

    const result = await getEmailMessages(session.businessId, { status, search });
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch inbox" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();

    // Allow demo inbound email simulation
    const { prisma } = await import("@/lib/db");
    const message = await prisma.emailMessage.create({
      data: {
        businessId: session.businessId,
        leadId: body.leadId || null,
        fromEmail: body.fromEmail,
        fromName: body.fromName || "",
        toEmail: body.toEmail,
        subject: body.subject,
        body: body.body,
        direction: "INBOUND",
        status: "UNREAD",
      },
    });

    // Create notification for all team members
    const users = await prisma.user.findMany({
      where: { businessId: session.businessId },
      select: { id: true },
    });
    await prisma.notification.createMany({
      data: users.map((u) => ({
        businessId: session.businessId,
        userId: u.id,
        title: `New Email: ${body.subject}`,
        message: `From: ${body.fromName || body.fromEmail}`,
        type: "EMAIL",
        link: `/inbox`,
      })),
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/inbox error:", error);
    return NextResponse.json({ error: "Failed to save email" }, { status: 500 });
  }
}
