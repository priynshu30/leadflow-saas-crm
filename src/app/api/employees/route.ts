import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET - list all users in the same business (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admins only." }, { status: 403 });
    }

    const employees = await prisma.user.findMany({
      where: { businessId: session.businessId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        canAddLeads: true,
        canViewAllLeads: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ employees });
  } catch (error: any) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

// PATCH - update role, permissions or password (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admins only." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role, canAddLeads, canViewAllLeads, password } = body;

    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    // Make sure the target user belongs to same business
    const targetUser = await prisma.user.findFirst({
      where: { id: Number(userId), businessId: session.businessId },
    });

    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const dataToUpdate: any = {};
    if (role !== undefined) dataToUpdate.role = role;
    if (canAddLeads !== undefined) dataToUpdate.canAddLeads = Boolean(canAddLeads);
    if (canViewAllLeads !== undefined) dataToUpdate.canViewAllLeads = Boolean(canViewAllLeads);

    if (password && typeof password === "string" && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      dataToUpdate.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id: Number(userId) },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canAddLeads: true,
        canViewAllLeads: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: password ? "Password and details updated successfully!" : "Updated successfully!",
      user: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/employees error:", error);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}

// DELETE - remove an employee from business (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admins only." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    // Prevent deleting yourself
    if (Number(userId) === session.userId) {
      return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: Number(userId), businessId: session.businessId },
    });

    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.user.delete({ where: { id: Number(userId) } });

    return NextResponse.json({ success: true, message: "Employee removed" });
  } catch (error: any) {
    console.error("DELETE /api/employees error:", error);
    return NextResponse.json({ error: "Failed to remove employee" }, { status: 500 });
  }
}
