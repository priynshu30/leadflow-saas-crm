import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
      include: { business: true },
    });

    if (!user) {
      // Log failed attempt (user not found)
      await prisma.loginLog.create({
        data: {
          email: validated.email.toLowerCase(),
          success: false,
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isValidPassword) {
      // Log failed attempt (wrong password)
      await prisma.loginLog.create({
        data: {
          userId: user.id,
          businessId: user.businessId,
          email: user.email,
          success: false,
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if business account is SUSPENDED
    if (user.business.status === "SUSPENDED") {
      await prisma.loginLog.create({
        data: {
          userId: user.id,
          businessId: user.businessId,
          email: user.email,
          success: false,
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json(
        { error: "Your business account has been suspended. Please contact platform support." },
        { status: 403 }
      );
    }

    // Log successful attempt
    await prisma.loginLog.create({
      data: {
        userId: user.id,
        businessId: user.businessId,
        email: user.email,
        success: true,
        ipAddress,
        userAgent,
      },
    });

    const token = await createSessionToken({
      userId: user.id,
      businessId: user.businessId,
      email: user.email,
      name: user.name,
      businessName: user.business.name,
      businessType: user.business.businessType,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        businessId: user.businessId,
        businessName: user.business.name,
        businessType: user.business.businessType,
      },
    });

    response.cookies.set("leadflow_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to login. Please try again." }, { status: 500 });
  }
}
