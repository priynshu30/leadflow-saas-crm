"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarHeart,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Shield,
  Users,
  Check,
  X,
  MessageSquare,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ApplyLeaveModal } from "@/components/leaves/ApplyLeaveModal";
import { format } from "date-fns";

interface LeaveRecord {
  id: number;
  businessId: number;
  userId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  approvedAt: string | null;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: string;
  };
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  CASUAL: "🏖️ Casual Leave",
  SICK: "🤒 Sick Leave",
  EMERGENCY: "🚨 Urgent / Emergency",
  HALF_DAY_FIRST: "🌓 Half Day (1st Half)",
  HALF_DAY_SECOND: "🌗 Half Day (2nd Half)",
  PAID: "💼 Paid Leave",
  UNPAID: "📝 Unpaid Leave",
};

export default function LeavesPage() {
  const { showToast } = useToast();

  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [userRole, setUserRole] = useState<"ADMIN" | "AGENT">("AGENT");
  const [teamEmployees, setTeamEmployees] = useState<{ id: number; name: string; email: string }[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [rejectingLeave, setRejectingLeave] = useState<LeaveRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/leaves?filter=${filterTab}`;
      if (selectedEmployeeId !== "all") {
        url += `&employeeId=${selectedEmployeeId}`;
      }

      const [res, empRes] = await Promise.all([
        fetch(url),
        fetch("/api/employees"),
      ]);

      if (res.ok) {
        const data = await res.json();
        setLeaves(data.leaves || []);
        setUserRole(data.userRole || "AGENT");
      }

      if (empRes.ok) {
        const empData = await empRes.json();
        setTeamEmployees(empData.employees || []);
      }
    } catch {
      showToast("Failed to load leave requests", "error");
    } finally {
      setLoading(false);
    }
  }, [filterTab, selectedEmployeeId, showToast]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleApprove = async (leave: LeaveRecord) => {
    setProcessingId(leave.id);
    try {
      const res = await fetch("/api/leaves", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveId: leave.id,
          action: "APPROVE",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve leave");

      showToast(`✅ Leave approved for ${leave.user.name}!`, "success");
      fetchLeaves();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingLeave) return;

    setProcessingId(rejectingLeave.id);
    try {
      const res = await fetch("/api/leaves", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveId: rejectingLeave.id,
          action: "REJECT",
          adminNote: rejectReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject leave");

      showToast(`❌ Leave request rejected for ${rejectingLeave.user.name}.`, "success");
      setRejectingLeave(null);
      setRejectReason("");
      fetchLeaves();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const totalLeaves = leaves.length;
  const pendingLeaves = leaves.filter((l) => l.status === "PENDING").length;
  const approvedLeaves = leaves.filter((l) => l.status === "APPROVED").length;
  const rejectedLeaves = leaves.filter((l) => l.status === "REJECTED").length;

  return (
    <>
      {/* Apply Leave Modal */}
      {showApplyModal && (
        <ApplyLeaveModal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          onLeaveApplied={fetchLeaves}
        />
      )}

      {/* Reject Leave Note Modal */}
      {rejectingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-rose-600" /> Reject Leave Request
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rejecting leave for <strong>{rejectingLeave.user.name}</strong> ({rejectingLeave.startDate} to {rejectingLeave.endDate})
                </p>
              </div>
              <button
                onClick={() => {
                  setRejectingLeave(null);
                  setRejectReason("");
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Rejection (Optional message to employee)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Critical site visit scheduled on this date..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  size="sm"
                  onClick={() => {
                    setRejectingLeave(null);
                    setRejectReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={processingId === rejectingLeave.id}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarHeart className="h-6 w-6 text-indigo-600" />
              {userRole === "ADMIN" ? "Team Leave Requests & Approvals" : "My Leave Requests"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {userRole === "ADMIN"
                ? "👑 Company Owner: Review, approve, or reject employee leave applications"
                : "Apply for casual, sick, or emergency leave and track approval status"}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowApplyModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Apply for Leave
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500">Total Applied</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalLeaves}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500">Pending Approval</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingLeaves}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500">Approved Leaves</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{approvedLeaves}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500">Rejected</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{rejectedLeaves}</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
          {/* Tabs */}
          <div className="flex gap-1">
            {[
              { id: "all", label: "All Leaves" },
              { id: "pending", label: `Pending (${pendingLeaves})` },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  filterTab === tab.id
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Employee Filter (Owner Only) */}
          {userRole === "ADMIN" && teamEmployees.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-indigo-600" /> Filter by Employee:
              </span>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="text-xs font-semibold rounded-xl border border-slate-300 px-3 py-1.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">👥 All Employees (Owner View)</option>
                {teamEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id.toString()}>
                    👤 {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Leaves List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin h-8 w-8 rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <CalendarHeart className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700">No leave requests found</p>
            <p className="text-xs text-slate-500 mt-1">
              Employees can click "Apply for Leave" whenever they need time off.
            </p>
            <Button
              className="mt-4 bg-indigo-600 text-white"
              size="sm"
              onClick={() => setShowApplyModal(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Apply for Leave
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {leaves.map((leave) => {
              const isPending = leave.status === "PENDING";
              const isApproved = leave.status === "APPROVED";
              const isRejected = leave.status === "REJECTED";

              return (
                <div
                  key={leave.id}
                  className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all ${
                    isPending
                      ? "border-amber-300 ring-2 ring-amber-500/10"
                      : isApproved
                      ? "border-emerald-200"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Left Details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isPending
                              ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                              : isApproved
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {isPending ? "⏳ PENDING APPROVAL" : isApproved ? "✅ APPROVED" : "❌ REJECTED"}
                        </span>

                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}
                        </span>

                        <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {leave.totalDays} Day{leave.totalDays > 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Employee Info */}
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          👤 {leave.user.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">
                          {leave.user.email} · Applied on {format(new Date(leave.createdAt), "dd MMM yyyy, hh:mm a")}
                        </p>
                      </div>

                      {/* Leave Date Range */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div className="flex items-center gap-2 text-slate-800 font-bold">
                          <Calendar className="h-4 w-4 text-indigo-600" />
                          <span>
                            {leave.startDate} {leave.startDate !== leave.endDate ? `to ${leave.endDate}` : "(Single Day)"}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1.5 whitespace-pre-wrap">
                          <strong className="text-slate-700">Reason:</strong> {leave.reason}
                        </p>
                      </div>

                      {/* Admin Note if Rejected / Approved with note */}
                      {leave.adminNote && (
                        <div className="text-xs bg-rose-50 text-rose-800 p-2.5 rounded-xl border border-rose-200">
                          <strong>Owner Remark:</strong> {leave.adminNote}
                        </div>
                      )}
                    </div>

                    {/* Right Actions: Owner Approve / Reject Buttons */}
                    {userRole === "ADMIN" && isPending && (
                      <div className="flex sm:flex-col gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(leave)}
                          loading={processingId === leave.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setRejectingLeave(leave);
                            setRejectReason("");
                          }}
                          disabled={processingId === leave.id}
                          className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs"
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
