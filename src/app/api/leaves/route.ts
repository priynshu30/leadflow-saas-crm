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
    const filter = searchParams.get("filter") || "all"; // "all" | "pending" | "approved" | "rejected"
    const employeeId = searchParams.get("employeeId");

    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    const isAdmin = currentUser?.role === "ADMIN";

    const whereClause: any = {
      businessId: session.businessId,
    };

    // If not admin, strictly lock to user's own leave requests
    if (!isAdmin) {
      whereClause.userId = session.userId;
    } else if (employeeId && employeeId !== "all") {
      whereClause.userId = parseInt(employeeId, 10);
    }

    if (filter === "pending") {
      whereClause.status = "PENDING";
    } else if (filter === "approved") {
      whereClause.status = "APPROVED";
    } else if (filter === "rejected") {
      whereClause.status = "REJECTED";
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: whereClause,
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

    return NextResponse.json({
      leaves,
      userRole: currentUser?.role || "AGENT",
    });
  } catch (error: any) {
    console.error("GET /api/leaves error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave requests" },
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
    const { leaveType, startDate, endDate, totalDays, reason } = body;

    if (!startDate || !endDate || !reason?.trim()) {
      return NextResponse.json(
        { error: "Start date, end date and reason are required" },
        { status: 400 }
      );
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        businessId: session.businessId,
        userId: session.userId,
        leaveType: leaveType || "CASUAL",
        startDate,
        endDate,
        totalDays: totalDays ? parseFloat(totalDays) : 1.0,
        reason: reason.trim(),
        status: "PENDING",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify all company Admins / Owners about the new leave request
    try {
      const admins = await prisma.user.findMany({
        where: { businessId: session.businessId, role: "ADMIN" },
        select: { id: true },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            businessId: session.businessId,
            userId: admin.id,
            title: `New Leave Request from ${leave.user.name}`,
            message: `${leave.user.name} applied for ${leave.totalDays} day(s) ${leave.leaveType} leave (${startDate} to ${endDate})`,
            type: "SYSTEM",
            link: "/leaves",
          },
        });
      }
    } catch { /* ignore notification error */ }

    return NextResponse.json({
      success: true,
      message: "Leave request submitted successfully! Awaiting Company Owner approval.",
      leave,
    });
  } catch (error: any) {
    console.error("POST /api/leaves error:", error);
    return NextResponse.json(
      { error: "Failed to submit leave request" },
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

    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    // Only Company Owner / Admins can approve or reject leaves
    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only Company Owner / Admin can approve or reject leaves." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { leaveId, action, adminNote } = body; // action: "APPROVE" | "REJECT"

    if (!leaveId || !action) {
      return NextResponse.json(
        { error: "Leave ID and action (APPROVE/REJECT) are required" },
        { status: 400 }
      );
    }

    const leave = await prisma.leaveRequest.findFirst({
      where: {
        id: parseInt(leaveId, 10),
        businessId: session.businessId,
      },
    });

    if (!leave) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      );
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updated = await prisma.leaveRequest.update({
      where: { id: leave.id },
      data: {
        status: newStatus,
        adminNote: adminNote ? adminNote.trim() : null,
        approvedAt: new Date(),
        approvedBy: session.userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Send notification to the employee about the decision
    try {
      await prisma.notification.create({
        data: {
          businessId: session.businessId,
          userId: leave.userId,
          title: `Leave Request ${newStatus === "APPROVED" ? "Approved ✅" : "Rejected ❌"}`,
          message: `Your leave request for ${leave.startDate} to ${leave.endDate} has been ${newStatus.toLowerCase()} by Company Owner.${adminNote ? ` Note: "${adminNote}"` : ""}`,
          type: "SYSTEM",
          link: "/leaves",
        },
      });
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      message: `Leave request has been ${newStatus === "APPROVED" ? "Approved ✅" : "Rejected ❌"} successfully!`,
      leave: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/leaves error:", error);
    return NextResponse.json(
      { error: "Failed to update leave request status" },
      { status: 500 }
    );
  }
}
