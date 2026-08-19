import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getReports } from "@/server/reports/service";

export async function GET() {
  try {
    const session = await requireSession();
    const data = await getReports(session.businessId);
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
