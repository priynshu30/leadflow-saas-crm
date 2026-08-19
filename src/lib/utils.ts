import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isTomorrow, isPast, startOfDay, endOfDay, addDays } from "date-fns";
import { FollowUpBucket } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIndianPhone(phone: string, defaultCountryCode: string = "91"): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+${defaultCountryCode} ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length > 10 && cleaned.startsWith("91")) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function getCleanPhoneForLinks(phone: string, defaultCountryCode: string = "91"): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    digits = `${defaultCountryCode}${digits}`;
  }
  return digits;
}

export function getWhatsAppLink(phone: string, message?: string, defaultCountryCode: string = "91"): string {
  const cleanPhone = getCleanPhoneForLinks(phone, defaultCountryCode);
  const base = `https://wa.me/${cleanPhone}`;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
}

export function getCallLink(phone: string, defaultCountryCode: string = "91"): string {
  const cleanPhone = getCleanPhoneForLinks(phone, defaultCountryCode);
  return `tel:+${cleanPhone}`;
}

export function calculateFollowUpBucket(scheduledAt: Date | string, status: string): FollowUpBucket {
  if (status === "DONE" || status === "CANCELLED") {
    return "completed";
  }

  const date = new Date(scheduledAt);
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrowStart = startOfDay(addDays(now, 1));
  const tomorrowEnd = endOfDay(addDays(now, 1));

  if (date < todayStart) {
    return "overdue";
  }
  if (date >= todayStart && date <= todayEnd) {
    return "today";
  }
  if (date >= tomorrowStart && date <= tomorrowEnd) {
    return "tomorrow";
  }
  return "upcoming";
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return format(d, "dd MMM yyyy, hh:mm a");
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return format(d, "dd MMM yyyy");
}
