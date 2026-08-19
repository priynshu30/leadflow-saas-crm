import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getActivities, createActivity } from "@/server/activities/service";
import { z } from "zod";

const createActivitySchema = z.object({
  leadId: z.number().int(),
  type: z.enum(["CALL", "WHATSAPP", "EMAIL", "STATUS_CHANGE", "NOTE", "LEAD_CREATED"]),
  description: z.string().min(1, "Description is required"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const activities = await getActivities(session.businessId, parseInt(leadId, 10));
    return NextResponse.json({ activities });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/activities error:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const validated = createActivitySchema.parse(body);

    const activity = await createActivity(session.businessId, session.userId, validated);
    return NextResponse.json({ success: true, activity }, { status: 201 });
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
    console.error("POST /api/activities error:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}
