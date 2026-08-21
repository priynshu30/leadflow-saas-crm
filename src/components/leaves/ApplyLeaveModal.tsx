"use client";

import React, { useState } from "react";
import {
  CalendarHeart,
  X,
  CheckCircle2,
  Calendar,
  FileText,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { format, differenceInCalendarDays, parseISO } from "date-fns";

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeaveApplied: () => void;
}

const LEAVE_TYPES = [
  { value: "CASUAL", label: "🏖️ Casual Leave" },
  { value: "SICK", label: "🤒 Sick / Medical Leave" },
  { value: "EMERGENCY", label: "🚨 Urgent / Emergency Leave" },
  { value: "HALF_DAY_FIRST", label: "🌓 Half Day (Morning 1st Half)" },
  { value: "HALF_DAY_SECOND", label: "🌗 Half Day (Afternoon 2nd Half)" },
  { value: "PAID", label: "💼 Paid Leave" },
  { value: "UNPAID", label: "📝 Unpaid Leave" },
];

export function ApplyLeaveModal({
  isOpen,
  onClose,
  onLeaveApplied,
}: ApplyLeaveModalProps) {
  const { showToast } = useToast();

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [leaveType, setLeaveType] = useState("CASUAL");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Calculate total days
  const calculateTotalDays = () => {
    if (leaveType.startsWith("HALF_DAY")) return 0.5;
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const diff = differenceInCalendarDays(end, start);
      return diff >= 0 ? diff + 1 : 1;
    } catch {
      return 1;
    }
  };

  const totalDays = calculateTotalDays();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      showToast("Please provide a valid reason (at least 5 characters)", "error");
      return;
    }

    if (startDate > endDate && !leaveType.startsWith("HALF_DAY")) {
      showToast("End date cannot be earlier than start date", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate: leaveType.startsWith("HALF_DAY") ? startDate : endDate,
          totalDays,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit leave request");

      showToast("✅ Leave request submitted to Company Owner!", "success");
      onLeaveApplied();
      onClose();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 my-auto">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarHeart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Apply for Leave</h2>
              <p className="text-xs text-slate-500">Request will be sent to Company Owner for approval</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Leave Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Leave Type *
            </label>
            <select
              value={leaveType}
              onChange={(e) => {
                setLeaveType(e.target.value);
                if (e.target.value.startsWith("HALF_DAY")) {
                  setEndDate(startDate);
                }
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              {LEAVE_TYPES.map((lt) => (
                <option key={lt.value} value={lt.value}>
                  {lt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {leaveType.startsWith("HALF_DAY") ? "Leave Date *" : "Start Date *"}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (leaveType.startsWith("HALF_DAY") || endDate < e.target.value) {
                    setEndDate(e.target.value);
                  }
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {!leaveType.startsWith("HALF_DAY") && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            )}
          </div>

          {/* Duration Summary Badge */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
            <span className="font-semibold text-indigo-900 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-indigo-600" /> Total Duration:
            </span>
            <span className="font-extrabold text-indigo-700 text-sm">
              {totalDays} Day{totalDays > 1 ? "s" : ""}
            </span>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Leave *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Urgent personal family work / Doctor appointment..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Notice for Owner Approval */}
          <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
            💡 Once submitted, Company Owner (Priyanshu) will review and approve or reject your leave request.
          </p>

          {/* Footer Actions */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={submitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
