import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getLeads, createLead, checkDuplicatePhone } from "@/server/leads/service";
import { createLeadSchema } from "@/lib/validations";
import { LeadStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || undefined;
    const status = (searchParams.get("status") as LeadStatus) || undefined;
    const source = searchParams.get("source") || undefined;
    const assignedUserId = searchParams.get("assignedUserId")
      ? parseInt(searchParams.get("assignedUserId")!, 10)
      : undefined;

    const result = await getLeads(session.businessId, {
      page,
      limit,
      search,
      status,
      source,
      assignedUserId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/leads error:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const validated = createLeadSchema.parse(body);

    // Check duplicate
    const duplicate = await checkDuplicatePhone(session.businessId, validated.phone);
    if (duplicate && !req.headers.get("x-ignore-duplicate")) {
      return NextResponse.json(
        {
          error: "A lead with this phone number already exists",
          duplicateLead: duplicate,
        },
        { status: 409 }
      );
    }

    const lead = await createLead(session.businessId, session.userId, {
      name: validated.name,
      phone: validated.phone,
      email: validated.email,
      alternatePhone: validated.alternatePhone,
      source: validated.source,
      status: validated.status,
      field1Label: validated.field1Label,
      field1Value: validated.field1Value,
      field2Label: validated.field2Label,
      field2Value: validated.field2Value,
      field3Label: validated.field3Label,
      field3Value: validated.field3Value,
      field4Label: validated.field4Label,
      field4Value: validated.field4Value,
      notes: validated.notes,
      nextFollowupAt: validated.nextFollowupAt,
      assignedUserId: validated.assignedUserId,
    });

    return NextResponse.json({ success: true, lead }, { status: 201 });
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
    console.error("POST /api/leads error:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
