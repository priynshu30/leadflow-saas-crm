import { BusinessType, LeadStatus } from "@/types";

export const BUSINESS_TYPE_LABELS: Record<BusinessType, { name: string; field1: string; field2: string; field3: string; field4: string }> = {
  REAL_ESTATE: {
    name: "Real Estate / Property",
    field1: "Property Type",
    field2: "Location",
    field3: "Bedrooms",
    field4: "Budget",
  },
  AUTOMOBILE: {
    name: "Automobile / Car Dealership",
    field1: "Car Model",
    field2: "Budget",
    field3: "New/Used",
    field4: "Fuel Type",
  },
  INSURANCE: {
    name: "Insurance Agency",
    field1: "Policy Type",
    field2: "Premium Budget",
    field3: "Coverage Amount",
    field4: "Nominee/Notes",
  },
  INTERIOR_DESIGN: {
    name: "Interior Design & Architecture",
    field1: "Space Type",
    field2: "Budget",
    field3: "Timeline",
    field4: "Square Feet",
  },
  LOAN_FINANCE: {
    name: "Loans & Financial Services",
    field1: "Loan Type",
    field2: "Required Amount",
    field3: "Tenure (Years)",
    field4: "Monthly Income",
  },
  SOLAR: {
    name: "Solar Energy Solutions",
    field1: "Property Type",
    field2: "System Size (kW)",
    field3: "Budget",
    field4: "Roof Area",
  },
  PHOTOGRAPHY: {
    name: "Photography & Studios",
    field1: "Event Type",
    field2: "Event Date",
    field3: "Package",
    field4: "Location",
  },
  EDUCATION: {
    name: "Education & Coaching",
    field1: "Course / Program",
    field2: "Batch / Timing",
    field3: "Budget / Fee",
    field4: "Student Grade",
  },
  OTHER: {
    name: "Other Business",
    field1: "Requirement",
    field2: "Budget",
    field3: "Timeline",
    field4: "Preference",
  },
};

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  NEW: {
    label: "New",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-700",
    dot: "bg-slate-500",
  },
  CONTACTED: {
    label: "Contacted",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  INTERESTED: {
    label: "Interested",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  FOLLOW_UP: {
    label: "Follow Up",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  SITE_VISIT: {
    label: "Site Visit / Meeting",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
    dot: "bg-indigo-500",
  },
  CONVERTED: {
    label: "Converted",
    bg: "bg-green-100 dark:bg-green-950/50",
    text: "text-green-800 dark:text-green-200",
    border: "border-green-300 dark:border-green-700",
    dot: "bg-green-600",
  },
  LOST: {
    label: "Lost",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500",
  },
};

export const COMMON_LEAD_SOURCES = [
  "Direct Call",
  "WhatsApp",
  "Walk-in",
  "Referral",
  "Instagram",
  "Facebook Ads",
  "Google Ads",
  "99acres / MagicBricks",
  "Cardekho / Carwale",
  "Justdial / IndiaMART",
  "Website",
  "Other",
];
