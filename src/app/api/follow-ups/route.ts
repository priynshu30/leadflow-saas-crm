import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getFollowUps, createFollowUp } from "@/server/followups/service";
import { createFollowUpSchema } from "@/lib/validations";
import { FollowUpBucket } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const bucket = (searchParams.get("bucket") as FollowUpBucket) || "today";

    const result = await getFollowUps(session.businessId, bucket);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/follow-ups error:", error);
    return NextResponse.json({ error: "Failed to fetch follow-ups" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const validated = createFollowUpSchema.parse(body);

    const followUp = await createFollowUp(session.businessId, session.userId, {
      leadId: validated.leadId,
      scheduledAt: validated.scheduledAt,
      note: validated.note,
    });

    return NextResponse.json({ success: true, followUp }, { status: 201 });
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
    console.error("POST /api/follow-ups error:", error);
    return NextResponse.json({ error: "Failed to create follow-up" }, { status: 500 });
  }
}
