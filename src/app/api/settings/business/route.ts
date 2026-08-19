import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getBusinessSettings, updateBusinessSettings } from "@/server/settings/service";
import { businessSettingsSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await requireSession();
    const settings = await getBusinessSettings(session.businessId);
    return NextResponse.json({ settings });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/settings/business error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const validated = businessSettingsSchema.parse(body);

    const updated = await updateBusinessSettings(session.businessId, validated);
    return NextResponse.json({ success: true, settings: updated });
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
    console.error("PATCH /api/settings/business error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
