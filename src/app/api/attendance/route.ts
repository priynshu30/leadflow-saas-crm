import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Today's attendance for current user
    const myTodayAttendance = await prisma.attendance.findFirst({
      where: {
        userId: session.userId,
        date: todayStr,
      },
    });

    // If admin, fetch all team attendance for today
    let teamTodayAttendance: any[] = [];
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (currentUser?.role === "ADMIN") {
      teamTodayAttendance = await prisma.attendance.findMany({
        where: {
          businessId: session.businessId,
          date: todayStr,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      myTodayAttendance,
      teamTodayAttendance,
      userRole: currentUser?.role || "AGENT",
    });
  } catch (error: any) {
    console.error("GET /api/attendance error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
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
    const { sodSelfieUrl, sodLat, sodLng, sodLocationName } = body;

    if (!sodSelfieUrl) {
      return NextResponse.json(
        { error: "Live selfie photo is required for Clock-In (SOD)." },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Check if already clocked in today
    const existing = await prisma.attendance.findFirst({
      where: {
        userId: session.userId,
        date: todayStr,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already clocked in for today!" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: session.userId,
        businessId: session.businessId,
        date: todayStr,
        sodTime: new Date(),
        sodSelfieUrl,
        sodLat: sodLat ? parseFloat(sodLat) : null,
        sodLng: sodLng ? parseFloat(sodLng) : null,
        sodLocationName: sodLocationName || "GPS Location Captured",
        status: "CLOCKED_IN",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Clocked in (SOD) successfully with Selfie & Location!",
      attendance,
    });
  } catch (error: any) {
    console.error("POST /api/attendance error:", error);
    return NextResponse.json(
      { error: "Failed to clock in" },
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
    const { eodSelfieUrl, eodLat, eodLng, eodLocationName, eodSummary } = body;

    const todayStr = new Date().toISOString().split("T")[0];

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: session.userId,
        date: todayStr,
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "No active SOD Clock-In found for today." },
        { status: 404 }
      );
    }

    if (attendance.status === "CLOCKED_OUT") {
      return NextResponse.json(
        { error: "You have already clocked out for today!" },
        { status: 400 }
      );
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        eodTime: new Date(),
        eodSelfieUrl: eodSelfieUrl || null,
        eodLat: eodLat ? parseFloat(eodLat) : null,
        eodLng: eodLng ? parseFloat(eodLng) : null,
        eodLocationName: eodLocationName || "GPS Location Captured",
        eodSummary: eodSummary || "End of day completed",
        status: "CLOCKED_OUT",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Clocked out (EOD) successfully!",
      attendance: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/attendance error:", error);
    return NextResponse.json(
      { error: "Failed to clock out" },
      { status: 500 }
    );
  }
}
