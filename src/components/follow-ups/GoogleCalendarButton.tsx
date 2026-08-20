"use client";

import React from "react";
import { Calendar, CalendarPlus, Download } from "lucide-react";

interface GoogleCalendarButtonProps {
  title: string;
  description: string;
  startDate: Date | string;
  durationMinutes?: number;
  location?: string;
  className?: string;
  variant?: "badge" | "button";
}

export const GoogleCalendarButton: React.FC<GoogleCalendarButtonProps> = ({
  title,
  description,
  startDate,
  durationMinutes = 30,
  location = "Phone Call / CRM Meeting",
  className = "",
  variant = "badge",
}) => {
  const start = new Date(startDate);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  // Format YYYYMMDDTHHmmssZ
  const formatDateISO = (d: Date) => {
    return d.toISOString().replace(/-|:|\.\d+/g, "");
  };

  const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&dates=${formatDateISO(start)}/${formatDateISO(end)}&details=${encodeURIComponent(
    description
  )}&location=${encodeURIComponent(location)}`;

  // Generate .ics calendar download
  const handleDownloadICS = () => {
    const icsData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//LeadFlow SaaS CRM//EN",
      "BEGIN:VEVENT",
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `DTSTART:${formatDateISO(start)}`,
      `DTEND:${formatDateISO(end)}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `Followup_${title.replace(/\s+/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (variant === "button") {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <a
          href={gCalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200/80 shadow-2xs"
          title="Add to Google Calendar"
        >
          <CalendarPlus className="h-3.5 w-3.5 text-indigo-600" />
          <span>Google Calendar</span>
        </a>
        <button
          type="button"
          onClick={handleDownloadICS}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 shadow-2xs"
          title="Download .ICS file (Outlook/Apple Calendar)"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <a
      href={gCalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline ${className}`}
      title="Add to Google Calendar"
    >
      <Calendar className="h-3 w-3" />
      <span>+ GCal</span>
    </a>
  );
};
