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
    const leadId = searchParams.get("leadId");

    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    const whereCondition: any = {
      businessId: session.businessId,
    };

    if (leadId) {
      whereCondition.leadId = parseInt(leadId, 10);
    } else if (currentUser?.role !== "ADMIN") {
      // Agents only see their own work proofs if not filtering by lead
      whereCondition.userId = session.userId;
    }

    const workProofs = await prisma.workProof.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ workProofs });
  } catch (error: any) {
    console.error("GET /api/work-proof error:", error);
    return NextResponse.json(
      { error: "Failed to fetch work proofs" },
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
    const { title, description, imageUrl, audioUrl, leadId, latitude, longitude, locationName } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Task / Proof title is required" },
        { status: 400 }
      );
    }

    const workProof = await prisma.workProof.create({
      data: {
        userId: session.userId,
        businessId: session.businessId,
        leadId: leadId ? parseInt(leadId, 10) : null,
        title: title.trim(),
        description: description ? description.trim() : null,
        imageUrl: imageUrl || null,
        audioUrl: audioUrl || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        locationName: locationName || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Work proof logged successfully!",
      workProof,
    });
  } catch (error: any) {
    console.error("POST /api/work-proof error:", error);
    return NextResponse.json(
      { error: "Failed to log work proof" },
      { status: 500 }
    );
  }
}
