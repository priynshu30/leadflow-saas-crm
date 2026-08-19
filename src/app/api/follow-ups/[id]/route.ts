import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { completeFollowUp } from "@/server/followups/service";
import { completeFollowUpSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const followUpId = parseInt(params.id, 10);
    if (isNaN(followUpId)) {
      return NextResponse.json({ error: "Invalid follow-up ID" }, { status: 400 });
    }

    const body = await req.json();
    const validated = completeFollowUpSchema.parse(body);

    const result = await completeFollowUp(
      session.businessId,
      session.userId,
      followUpId,
      validated
    );

    return NextResponse.json({ success: true, followUp: result });
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
    console.error("PATCH /api/follow-ups/[id] error:", error);
    return NextResponse.json({ error: "Failed to update follow-up" }, { status: 500 });
  }
}
