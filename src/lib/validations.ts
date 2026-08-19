import { z } from "zod";

export const registerSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessType: z.enum([
    "REAL_ESTATE",
    "AUTOMOBILE",
    "INSURANCE",
    "INTERIOR_DESIGN",
    "LOAN_FINANCE",
    "SOLAR",
    "PHOTOGRAPHY",
    "EDUCATION",
    "OTHER",
  ]),
  name: z.string().min(2, "Your name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const quickAddLeadSchema = z.object({
  name: z.string().min(1, "Lead name is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  source: z.string().optional().default("Direct Call"),
  field1Value: z.string().optional(),
  field2Value: z.string().optional(),
  field3Value: z.string().optional(),
  field4Value: z.string().optional(),
  notes: z.string().optional(),
  nextFollowupAt: z.string().datetime().optional().nullable(),
});

export const createLeadSchema = z.object({
  name: z.string().min(1, "Lead name is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  alternatePhone: z.string().optional().nullable(),
  source: z.string().optional().default("Direct Call"),
  status: z.enum([
    "NEW",
    "CONTACTED",
    "INTERESTED",
    "FOLLOW_UP",
    "SITE_VISIT",
    "CONVERTED",
    "LOST",
  ]).default("NEW"),
  field1Label: z.string().optional().nullable(),
  field1Value: z.string().optional().nullable(),
  field2Label: z.string().optional().nullable(),
  field2Value: z.string().optional().nullable(),
  field3Label: z.string().optional().nullable(),
  field3Value: z.string().optional().nullable(),
  field4Label: z.string().optional().nullable(),
  field4Value: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  nextFollowupAt: z.string().datetime().optional().nullable(),
  assignedUserId: z.number().int().optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const createFollowUpSchema = z.object({
  leadId: z.number().int({ message: "Lead ID is required" }),
  scheduledAt: z.string().datetime({ message: "Valid date and time is required" }),
  note: z.string().optional().nullable(),
});

export const completeFollowUpSchema = z.object({
  status: z.enum(["DONE", "CANCELLED"]).default("DONE"),
  note: z.string().optional().nullable(),
  nextFollowupAt: z.string().datetime().optional().nullable(),
});

export const businessSettingsSchema = z.object({
  name: z.string().min(2, "Business name is required").optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  businessType: z.enum([
    "REAL_ESTATE",
    "AUTOMOBILE",
    "INSURANCE",
    "INTERIOR_DESIGN",
    "LOAN_FINANCE",
    "SOLAR",
    "PHOTOGRAPHY",
    "EDUCATION",
    "OTHER",
  ]).optional(),
  field1Label: z.string().optional().nullable(),
  field2Label: z.string().optional().nullable(),
  field3Label: z.string().optional().nullable(),
  field4Label: z.string().optional().nullable(),
  defaultCountryCode: z.string().optional(),
});
