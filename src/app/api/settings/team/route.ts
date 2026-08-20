import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createTeamMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// GET /api/settings/team - List all users under the current business
export async function GET() {
  try {
    const session = await requireSession();

    const users = await prisma.user.findMany({
      where: { businessId: session.businessId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            leads: true,
            followUps: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/settings/team error:", error);
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
  }
}

// POST /api/settings/team - Create a new team member under the current business
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const validated = createTeamMemberSchema.parse(body);

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const newUser = await prisma.user.create({
      data: {
        businessId: session.businessId,
        name: validated.name.trim(),
        email: validated.email.toLowerCase().trim(),
        phone: validated.phone?.trim() || null,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    console.error("POST /api/settings/team error:", error);
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
  }
}
