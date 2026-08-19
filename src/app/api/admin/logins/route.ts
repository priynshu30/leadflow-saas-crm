import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminLogins } from "@/server/admin/service";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(req.url);
    const businessIdParam = searchParams.get("businessId");
    const businessId = businessIdParam ? parseInt(businessIdParam, 10) : undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const search = searchParams.get("search") || undefined;
    const successParam = searchParams.get("success");
    const success =
      successParam === "true" ? true : successParam === "false" ? false : undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = await getAdminLogins({
      businessId,
      from,
      to,
      success,
      search,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/admin/logins error:", error);
    return NextResponse.json({ error: "Failed to fetch logins" }, { status: 500 });
  }
}
