import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { checkDuplicatePhone } from "@/server/leads/service";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const excludeLeadId = searchParams.get("excludeLeadId")
      ? parseInt(searchParams.get("excludeLeadId")!, 10)
      : undefined;

    if (!phone || phone.trim().length < 5) {
      return NextResponse.json({ duplicate: null });
    }

    const duplicate = await checkDuplicatePhone(session.businessId, phone, excludeLeadId);

    return NextResponse.json({ duplicate });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to check duplicate" }, { status: 500 });
  }
}
