"use client";

import React, { useState } from "react";
import { LeadActivityItem } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Phone, MessageSquare, RefreshCw, FileText, UserPlus, Send, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface ActivityTimelineProps {
  leadId: number;
  activities: LeadActivityItem[];
  onActivityAdded?: () => void;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  leadId,
  activities,
  onActivityAdded,
}) => {
  const { showToast } = useToast();
  const [note, setNote] = useState("");
  const [activityType, setActivityType] = useState<"CALL" | "WHATSAPP" | "EMAIL" | "NOTE">("CALL");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          type: activityType,
          description: note.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to add activity");
      }

      setNote("");
      showToast("Activity logged successfully", "success");
      if (onActivityAdded) onActivityAdded();
    } catch (err: any) {
      showToast(err.message || "Could not log activity", "error");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "CALL":
        return <Phone className="h-3.5 w-3.5 text-blue-600" />;
      case "WHATSAPP":
        return <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />;
      case "EMAIL":
        return <Mail className="h-3.5 w-3.5 text-indigo-600" />;
      case "STATUS_CHANGE":
        return <RefreshCw className="h-3.5 w-3.5 text-amber-600" />;
      case "LEAD_CREATED":
        return <UserPlus className="h-3.5 w-3.5 text-indigo-600" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-slate-600" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case "CALL":
        return "bg-blue-100 border-blue-200";
      case "WHATSAPP":
        return "bg-emerald-100 border-emerald-200";
      case "EMAIL":
        return "bg-indigo-100 border-indigo-200";
      case "STATUS_CHANGE":
        return "bg-amber-100 border-amber-200";
      case "LEAD_CREATED":
        return "bg-indigo-100 border-indigo-200";
      default:
        return "bg-slate-100 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Log Activity Box */}
      <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActivityType("CALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activityType === "CALL"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Phone className="h-3.5 w-3.5" /> Call Log
          </button>
          <button
            type="button"
            onClick={() => setActivityType("WHATSAPP")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activityType === "WHATSAPP"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Log
          </button>
          <button
            type="button"
            onClick={() => setActivityType("EMAIL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activityType === "EMAIL"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Mail className="h-3.5 w-3.5" /> Email Log
          </button>
          <button
            type="button"
            onClick={() => setActivityType("NOTE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activityType === "NOTE"
                ? "bg-slate-800 text-white shadow-2xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> Quick Note
          </button>
        </div>

        <div className="relative">
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`Log outcome of ${activityType.toLowerCase()}...`}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          <div className="flex justify-end pt-1">
            <Button size="sm" type="submit" loading={loading} disabled={!note.trim()}>
              <Send className="h-3 w-3 mr-1" /> Log Activity
            </Button>
          </div>
        </div>
      </form>

      {/* Timeline items */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {activities.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No activity logged yet.</p>
        ) : (
          activities.map((act) => (
            <div key={act.id} className="relative group">
              <div
                className={`absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full border shadow-2xs ${getBg(
                  act.type
                )}`}
              >
                {getIcon(act.type)}
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700">{act.user?.name || "Team member"}</span>
                  <span>{formatDateTime(act.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-800 font-normal whitespace-pre-wrap">{act.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
