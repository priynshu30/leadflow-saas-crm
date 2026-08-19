import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminBusinessById, updateAdminBusiness } from "@/server/admin/service";
import { z } from "zod";

const updateBusinessSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  plan: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminSession();
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid business ID" }, { status: 400 });
    }

    const business = await getAdminBusinessById(id);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({ business });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/admin/businesses/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch business" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminSession();
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid business ID" }, { status: 400 });
    }

    const body = await req.json();
    const validated = updateBusinessSchema.parse(body);

    const updated = await updateAdminBusiness(id, validated);
    return NextResponse.json({ success: true, business: updated });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    console.error("PATCH /api/admin/businesses/[id] error:", error);
    return NextResponse.json({ error: "Failed to update business" }, { status: 500 });
  }
}
