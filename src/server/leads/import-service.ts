import { prisma } from "@/lib/db";
import { LeadStatus } from "@prisma/client";

export interface ImportLeadRow {
  name: string;
  phone: string;
  email?: string | null;
  alternatePhone?: string | null;
  source?: string | null;
  status?: LeadStatus;
  field1Value?: string | null;
  field2Value?: string | null;
  field3Value?: string | null;
  field4Value?: string | null;
  notes?: string | null;
  nextFollowupAt?: string | Date | null;
}

export async function importLeadsBatch(
  businessId: number,
  userId: number,
  leads: ImportLeadRow[],
  options: { skipDuplicates?: boolean } = { skipDuplicates: true }
) {
  // Fetch business default labels
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      field1Label: true,
      field2Label: true,
      field3Label: true,
      field4Label: true,
    },
  });

  // Fetch existing phones in this tenant for fast duplicate checking
  const existingLeads = await prisma.lead.findMany({
    where: { businessId },
    select: { phone: true },
  });

  const existingPhoneSet = new Set(
    existingLeads.map((l) => l.phone.replace(/\D/g, "").slice(-10))
  );

  let importedCount = 0;
  let skippedDuplicatesCount = 0;
  const errors: { row: number; reason: string }[] = [];

  for (let i = 0; i < leads.length; i++) {
    const row = leads[i];
    const rowNumber = i + 1;

    if (!row.name || !row.name.trim()) {
      errors.push({ row: rowNumber, reason: "Missing lead name" });
      continue;
    }

    if (!row.phone || !row.phone.toString().trim()) {
      errors.push({ row: rowNumber, reason: "Missing phone number" });
      continue;
    }

    const cleanPhone = row.phone.toString().trim();
    const last10 = cleanPhone.replace(/\D/g, "").slice(-10);

    if (existingPhoneSet.has(last10)) {
      if (options.skipDuplicates) {
        skippedDuplicatesCount++;
        continue;
      }
    }

    try {
      const nextFollowupDate = row.nextFollowupAt ? new Date(row.nextFollowupAt) : null;
      const validNextFollowup =
        nextFollowupDate && !isNaN(nextFollowupDate.getTime()) ? nextFollowupDate : null;

      const validStatuses: LeadStatus[] = [
        "NEW",
        "CONTACTED",
        "INTERESTED",
        "FOLLOW_UP",
        "SITE_VISIT",
        "CONVERTED",
        "LOST",
      ];
      const status: LeadStatus =
        row.status && validStatuses.includes(row.status.toUpperCase() as LeadStatus)
          ? (row.status.toUpperCase() as LeadStatus)
          : "NEW";

      const createdLead = await prisma.lead.create({
        data: {
          businessId,
          assignedUserId: userId,
          name: row.name.trim(),
          phone: cleanPhone,
          email: row.email ? row.email.trim() : null,
          alternatePhone: row.alternatePhone ? row.alternatePhone.trim() : null,
          source: row.source ? row.source.trim() : "Excel Import",
          status,
          field1Label: business?.field1Label,
          field1Value: row.field1Value ? row.field1Value.toString().trim() : null,
          field2Label: business?.field2Label,
          field2Value: row.field2Value ? row.field2Value.toString().trim() : null,
          field3Label: business?.field3Label,
          field3Value: row.field3Value ? row.field3Value.toString().trim() : null,
          field4Label: business?.field4Label,
          field4Value: row.field4Value ? row.field4Value.toString().trim() : null,
          notes: row.notes ? row.notes.toString().trim() : null,
          nextFollowupAt: validNextFollowup,
        },
      });

      // Log activity
      await prisma.leadActivity.create({
        data: {
          leadId: createdLead.id,
          userId,
          type: "LEAD_CREATED",
          description: "Lead imported via Excel spreadsheet.",
        },
      });

      // If next follow-up specified
      if (validNextFollowup) {
        await prisma.followUp.create({
          data: {
            leadId: createdLead.id,
            userId,
            scheduledAt: validNextFollowup,
            note: "Scheduled during Excel import",
          },
        });
      }

      existingPhoneSet.add(last10);
      importedCount++;
    } catch (err: any) {
      errors.push({ row: rowNumber, reason: err?.message || "Insert failed" });
    }
  }

  return {
    total: leads.length,
    imported: importedCount,
    skippedDuplicates: skippedDuplicatesCount,
    errors,
  };
}
