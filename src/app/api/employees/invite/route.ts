import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

// POST - Admin invites/creates a new agent for their business
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only admins can invite agents
    const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can invite team members" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password } = body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newAgent = await prisma.user.create({
      data: {
        businessId: session.businessId,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "AGENT",
        canAddLeads: false,
        canViewAllLeads: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canAddLeads: true,
        canViewAllLeads: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Agent "${name}" has been added to your team`,
      user: newAgent,
    });
  } catch (error: any) {
    console.error("POST /api/employees/invite error:", error);
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}
