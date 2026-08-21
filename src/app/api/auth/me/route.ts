import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [business, user] = await Promise.all([
      prisma.business.findUnique({
        where: { id: session.businessId },
      }),
      prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
          role: true,
          canAddLeads: true,
          canViewAllLeads: true,
        },
      }),
    ]);

    return NextResponse.json({
      user: {
        ...session,
        id: user?.id,
        name: user?.name || session.name,
        avatarUrl: user?.avatarUrl || null,
        phone: user?.phone || null,
        role: user?.role || "ADMIN",
        canAddLeads: user?.canAddLeads ?? true,
        canViewAllLeads: user?.canViewAllLeads ?? true,
      },
      business,
    });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
