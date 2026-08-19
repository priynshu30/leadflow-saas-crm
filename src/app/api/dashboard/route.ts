import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getDashboardStats } from "@/server/dashboard/service";

export async function GET() {
  try {
    const session = await requireSession();
    const data = await getDashboardStats(session.businessId);
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
