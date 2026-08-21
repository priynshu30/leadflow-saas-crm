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
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Today's attendance for current user
    const [myTodayAttendance, myTodayProofsCount, currentUser] = await Promise.all([
      prisma.attendance.findFirst({
        where: {
          userId: session.userId,
          date: todayStr,
        },
      }),
      prisma.workProof.count({
        where: {
          userId: session.userId,
          createdAt: {
            gte: startOfToday,
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: session.userId },
      }),
    ]);

    // If admin, fetch all team attendance for today
    let teamTodayAttendance: any[] = [];
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
      myTodayProofsCount,
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
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Mandatory Work Proof Check: Employee must have submitted at least 1 work proof today
    const todayProofsCount = await prisma.workProof.count({
      where: {
        userId: session.userId,
        createdAt: {
          gte: startOfToday,
        },
      },
    });

    if (todayProofsCount === 0) {
      return NextResponse.json(
        {
          error: "Work proof is required before EOD clock-out! Please submit at least 1 work proof (client visit photo or call recording) before clocking out.",
          needsWorkProof: true,
        },
        { status: 400 }
      );
    }

    // 2. Mandatory EOD Summary Check
    if (!eodSummary || !eodSummary.trim() || eodSummary.trim().length < 5) {
      return NextResponse.json(
        { error: "Please write a brief End-of-Day (EOD) work summary (at least 5 characters)." },
        { status: 400 }
      );
    }

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
        eodSummary: eodSummary.trim(),
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
