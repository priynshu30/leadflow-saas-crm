import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all"; // "all" | "today" | "active" | "completed"
    const leadId = searchParams.get("leadId");

    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    const isAdmin = currentUser?.role === "ADMIN";

    const whereClause: any = {
      businessId: session.businessId,
    };

    // If not admin, only show user's own visits
    if (!isAdmin) {
      whereClause.userId = session.userId;
    }

    if (leadId) {
      whereClause.leadId = parseInt(leadId, 10);
    }

    if (filter === "today") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      whereClause.createdAt = { gte: startOfToday };
    } else if (filter === "active") {
      whereClause.status = "IN_PROGRESS";
    } else if (filter === "completed") {
      whereClause.status = "COMPLETED";
    }

    const [visits, activeVisit] = await Promise.all([
      prisma.fieldVisit.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          lead: {
            select: { id: true, name: true, phone: true, status: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.fieldVisit.findFirst({
        where: {
          businessId: session.businessId,
          userId: session.userId,
          status: "IN_PROGRESS",
        },
        include: {
          lead: {
            select: { id: true, name: true, phone: true, status: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      visits,
      activeVisit,
      userRole: currentUser?.role || "AGENT",
    });
  } catch (error: any) {
    console.error("GET /api/visits error:", error);
    return NextResponse.json(
      { error: "Failed to fetch field visits" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      leadId,
      clientName,
      clientPhone,
      purpose,
      checkInLat,
      checkInLng,
      checkInLocation,
      checkInPhotoUrl,
    } = body;

    if (!clientName || !clientName.trim()) {
      return NextResponse.json(
        { error: "Client / Location name is required" },
        { status: 400 }
      );
    }

    // Check if user already has an active in-progress visit
    const ongoing = await prisma.fieldVisit.findFirst({
      where: {
        userId: session.userId,
        businessId: session.businessId,
        status: "IN_PROGRESS",
      },
    });

    if (ongoing) {
      return NextResponse.json(
        {
          error: `You already have an active visit with "${ongoing.clientName}". Please check out from that visit before starting a new one.`,
          activeVisitId: ongoing.id,
        },
        { status: 400 }
      );
    }

    const visit = await prisma.fieldVisit.create({
      data: {
        businessId: session.businessId,
        userId: session.userId,
        leadId: leadId ? parseInt(leadId, 10) : null,
        clientName: clientName.trim(),
        clientPhone: clientPhone ? clientPhone.trim() : null,
        purpose: purpose || "Site Visit",
        checkInTime: new Date(),
        checkInLat: checkInLat ? parseFloat(checkInLat) : null,
        checkInLng: checkInLng ? parseFloat(checkInLng) : null,
        checkInLocation: checkInLocation || "Location captured",
        checkInPhotoUrl: checkInPhotoUrl || null,
        status: "IN_PROGRESS",
      },
      include: {
        user: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true } },
      },
    });

    // Also log to Lead Activity if linked to lead
    if (leadId) {
      try {
        await prisma.leadActivity.create({
          data: {
            leadId: parseInt(leadId, 10),
            userId: session.userId,
            action: "VISIT_STARTED",
            description: `Started Field Visit (${purpose || "Meeting"}) at ${checkInLocation || "Client location"}`,
          },
        });
      } catch { /* ignore */ }
    }

    // Also auto-log as a WorkProof so attendance counts it
    try {
      await prisma.workProof.create({
        data: {
          userId: session.userId,
          businessId: session.businessId,
          leadId: leadId ? parseInt(leadId, 10) : null,
          title: `Field Visit Check-In: ${clientName.trim()}`,
          description: `Purpose: ${purpose || "Meeting"} | Location: ${checkInLocation || "GPS verified"}`,
          imageUrl: checkInPhotoUrl || null,
          latitude: checkInLat ? parseFloat(checkInLat) : null,
          longitude: checkInLng ? parseFloat(checkInLng) : null,
          locationName: checkInLocation || null,
        },
      });
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      message: `Checked in at ${clientName}! Visit started.`,
      visit,
    });
  } catch (error: any) {
    console.error("POST /api/visits error:", error);
    return NextResponse.json(
      { error: "Failed to start field visit" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      visitId,
      checkOutLat,
      checkOutLng,
      checkOutLocation,
      checkOutPhotoUrl,
      outcome,
      notes,
      amountCollected,
    } = body;

    if (!visitId) {
      return NextResponse.json(
        { error: "Visit ID is required" },
        { status: 400 }
      );
    }

    const visit = await prisma.fieldVisit.findFirst({
      where: {
        id: parseInt(visitId, 10),
        businessId: session.businessId,
      },
    });

    if (!visit) {
      return NextResponse.json(
        { error: "Field visit not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const start = new Date(visit.checkInTime);
    const durationMinutes = Math.max(1, Math.round((now.getTime() - start.getTime()) / 60000));

    const updated = await prisma.fieldVisit.update({
      where: { id: visit.id },
      data: {
        checkOutTime: now,
        checkOutLat: checkOutLat ? parseFloat(checkOutLat) : null,
        checkOutLng: checkOutLng ? parseFloat(checkOutLng) : null,
        checkOutLocation: checkOutLocation || "Location captured",
        checkOutPhotoUrl: checkOutPhotoUrl || null,
        durationMinutes,
        outcome: outcome || "NEEDS_FOLLOW_UP",
        notes: notes ? notes.trim() : null,
        amountCollected: amountCollected ? parseFloat(amountCollected) : null,
        status: "COMPLETED",
      },
      include: {
        user: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true } },
      },
    });

    // Log to Lead Activity if linked
    if (visit.leadId) {
      try {
        await prisma.leadActivity.create({
          data: {
            leadId: visit.leadId,
            userId: session.userId,
            action: "VISIT_COMPLETED",
            description: `Completed Field Visit (${durationMinutes} mins). Outcome: ${outcome || "Completed"}. Notes: ${notes || "None"}`,
          },
        });
      } catch { /* ignore */ }
    }

    // Auto-create WorkProof for departure
    try {
      await prisma.workProof.create({
        data: {
          userId: session.userId,
          businessId: session.businessId,
          leadId: visit.leadId || null,
          title: `Field Visit Check-Out: ${visit.clientName} (${durationMinutes}m)`,
          description: `Outcome: ${outcome || "Completed"} | Summary: ${notes || "Meeting concluded"}`,
          imageUrl: checkOutPhotoUrl || null,
          latitude: checkOutLat ? parseFloat(checkOutLat) : null,
          longitude: checkOutLng ? parseFloat(checkOutLng) : null,
          locationName: checkOutLocation || null,
        },
      });
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      message: `Field visit at ${visit.clientName} completed (${durationMinutes} mins)!`,
      visit: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/visits error:", error);
    return NextResponse.json(
      { error: "Failed to complete field visit" },
      { status: 500 }
    );
  }
}
