import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminSessionToken, setAdminSessionCookie } from "@/lib/admin-auth";

const adminLoginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = adminLoginSchema.parse(body);
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const admin = await prisma.superAdmin.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (!admin) {
      // Record failed admin login attempt
      await prisma.loginLog.create({
        data: {
          email: validated.email.toLowerCase(),
          success: false,
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(validated.password, admin.passwordHash);

    if (!isValid) {
      // Record failed admin login attempt
      await prisma.loginLog.create({
        data: {
          email: validated.email.toLowerCase(),
          success: false,
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    // Record successful admin login
    await prisma.loginLog.create({
      data: {
        email: admin.email,
        success: true,
        ipAddress,
        userAgent,
      },
    });

    const token = await createAdminSessionToken({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
    });

    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });

    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    console.error("SuperAdmin login error:", error);
    return NextResponse.json(
      { error: "Failed to login as admin" },
      { status: 500 }
    );
  }
}
