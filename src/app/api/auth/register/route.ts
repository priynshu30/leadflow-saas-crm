import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { BUSINESS_TYPE_LABELS } from "@/lib/constants";
import bcrypt from "bcryptjs";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Default 4 field labels based on business type
    const nicheLabels = BUSINESS_TYPE_LABELS[validated.businessType];
    const passwordHash = await bcrypt.hash(validated.password, 10);

    // Transaction: Create business + primary user
    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: validated.businessName,
          phone: validated.phone || null,
          businessType: validated.businessType,
          field1Label: nicheLabels.field1,
          field2Label: nicheLabels.field2,
          field3Label: nicheLabels.field3,
          field4Label: nicheLabels.field4,
        },
      });

      const user = await tx.user.create({
        data: {
          businessId: business.id,
          name: validated.name,
          email: validated.email.toLowerCase(),
          phone: validated.phone || null,
          passwordHash,
        },
      });

      return { business, user };
    });

    // Create session token and set cookie
    const token = await createSessionToken({
      userId: result.user.id,
      businessId: result.business.id,
      email: result.user.email,
      name: result.user.name,
      businessName: result.business.name,
      businessType: result.business.businessType,
    });

    setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        businessId: result.business.id,
        businessName: result.business.name,
        businessType: result.business.businessType,
      },
    });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Register error:", error);
    const msg = error?.message || "Failed to create account. Please check database connection.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
