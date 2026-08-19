import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { importLeadsBatch } from "@/server/leads/import-service";
import { z } from "zod";

const importPayloadSchema = z.object({
  leads: z.array(
    z.object({
      name: z.string(),
      phone: z.union([z.string(), z.number()]).transform((val) => val.toString()),
      email: z.string().optional().nullable(),
      alternatePhone: z.union([z.string(), z.number()]).optional().nullable().transform((val) => val ? val.toString() : null),
      source: z.string().optional().nullable(),
      status: z.any().optional().nullable(),
      field1Value: z.union([z.string(), z.number()]).optional().nullable().transform((val) => val ? val.toString() : null),
      field2Value: z.union([z.string(), z.number()]).optional().nullable().transform((val) => val ? val.toString() : null),
      field3Value: z.union([z.string(), z.number()]).optional().nullable().transform((val) => val ? val.toString() : null),
      field4Value: z.union([z.string(), z.number()]).optional().nullable().transform((val) => val ? val.toString() : null),
      notes: z.string().optional().nullable(),
      nextFollowupAt: z.string().optional().nullable(),
    })
  ),
  skipDuplicates: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const validated = importPayloadSchema.parse(body);

    if (validated.leads.length === 0) {
      return NextResponse.json(
        { error: "No lead rows provided in the upload" },
        { status: 400 }
      );
    }

    if (validated.leads.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 rows allowed per import batch" },
        { status: 400 }
      );
    }

    const result = await importLeadsBatch(
      session.businessId,
      session.userId,
      validated.leads,
      { skipDuplicates: validated.skipDuplicates }
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
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
    console.error("POST /api/leads/import error:", error);
    return NextResponse.json({ error: "Failed to import leads" }, { status: 500 });
  }
}
