export type BusinessType =
  | "REAL_ESTATE"
  | "AUTOMOBILE"
  | "INSURANCE"
  | "INTERIOR_DESIGN"
  | "LOAN_FINANCE"
  | "SOLAR"
  | "PHOTOGRAPHY"
  | "EDUCATION"
  | "OTHER";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "INTERESTED"
  | "FOLLOW_UP"
  | "SITE_VISIT"
  | "CONVERTED"
  | "LOST";

export type FollowUpStatus = "PENDING" | "DONE" | "CANCELLED";

export type FollowUpBucket =
  | "overdue"
  | "today"
  | "tomorrow"
  | "upcoming"
  | "completed";

export interface SessionUser {
  userId: number;
  businessId: number;
  email: string;
  name: string;
  businessName: string;
  businessType: BusinessType;
  avatarUrl?: string | null;
  phone?: string | null;
}

export interface BusinessSettings {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  businessType: BusinessType;
  field1Label?: string | null;
  field2Label?: string | null;
  field3Label?: string | null;
  field4Label?: string | null;
  defaultCountryCode?: string | null;
}

export interface LeadWithRelations {
  id: number;
  businessId: number;
  assignedUserId?: number | null;
  name: string;
  phone: string;
  email?: string | null;
  alternatePhone?: string | null;
  source?: string | null;
  status: LeadStatus;
  field1Label?: string | null;
  field1Value?: string | null;
  field2Label?: string | null;
  field2Value?: string | null;
  field3Label?: string | null;
  field3Value?: string | null;
  field4Label?: string | null;
  field4Value?: string | null;
  notes?: string | null;
  nextFollowupAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  assignedUser?: {
    id: number;
    name: string;
    email: string;
  } | null;
  followUps?: FollowUpItem[];
  activities?: LeadActivityItem[];
}

export interface FollowUpItem {
  id: number;
  leadId: number;
  userId: number;
  scheduledAt: string | Date;
  status: FollowUpStatus;
  note?: string | null;
  completedAt?: string | Date | null;
  createdAt: string | Date;
  lead?: {
    id: number;
    name: string;
    phone: string;
    status: LeadStatus;
    source?: string | null;
  };
  user?: {
    id: number;
    name: string;
  };
}

export interface LeadActivityItem {
  id: number;
  leadId: number;
  userId: number;
  type: "CALL" | "WHATSAPP" | "EMAIL" | "STATUS_CHANGE" | "NOTE" | "LEAD_CREATED";
  description: string;
  createdAt: string | Date;
  user?: {
    id: number;
    name: string;
  };
}

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  interestedLeads: number;
  followUpsDue: number;
  convertedLeads: number;
  overdueFollowUps: number;
  todayFollowUps: number;
}

export interface ReportData {
  statusCounts: Record<LeadStatus, number>;
  conversionRate: number;
  leadsBySource: { source: string; count: number }[];
  totalLeads: number;
  convertedCount: number;
  lostCount: number;
  leadTrends?: { date: string; leads: number; converted: number }[];
  activityTrends?: { day: string; Calls: number; WhatsApp: number; Notes: number; Total: number }[];
  funnelStages?: { stage: string; count: number; color: string }[];
}
