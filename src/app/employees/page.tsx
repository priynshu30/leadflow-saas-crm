"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Shield,
  Eye,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Crown,
  UserCheck,
  Mail,
  RefreshCw,
  UserCog,
  Check,
  X,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { InviteEmployeeModal } from "@/components/employees/InviteEmployeeModal";

interface Employee {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
  avatarUrl: string | null;
  canAddLeads: boolean;
  canViewAllLeads: boolean;
  createdAt: string;
}

export default function EmployeesPage() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, sessionRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/auth/me"),
      ]);
      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data.employees || []);
      } else if (empRes.status === 403) {
        showToast("Access denied. Admin only.", "error");
      }
      if (sessionRes.ok) {
        const sData = await sessionRes.json();
        setCurrentUserId(sData.user?.id || sData.user?.userId);
        setCurrentUserEmail(sData.user?.email || null);
      }
    } catch {
      showToast("Failed to load team members", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleToggle = async (emp: Employee, field: "canAddLeads" | "canViewAllLeads" | "role") => {
    setUpdating(emp.id);
    try {
      let updatePayload: any = { userId: emp.id };
      if (field === "canAddLeads") updatePayload.canAddLeads = !emp.canAddLeads;
      if (field === "canViewAllLeads") updatePayload.canViewAllLeads = !emp.canViewAllLeads;
      if (field === "role") updatePayload.role = emp.role === "ADMIN" ? "AGENT" : "ADMIN";

      const res = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setEmployees((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...e, ...data.user } : e))
      );
      showToast(`Permissions updated for ${emp.name}!`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update employee", "error");
    } finally {
      setUpdating(null);
    }
  };

  const handleSetRole = async (emp: Employee, newRole: "ADMIN" | "AGENT") => {
    if (emp.role === newRole) return;
    setUpdating(emp.id);
    try {
      const res = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: emp.id, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setEmployees((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...e, ...data.user } : e))
      );
      showToast(`Role updated to ${newRole === "ADMIN" ? "Administrator" : "Field Agent"}!`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (emp: Employee) => {
    if (!confirm(`Remove ${emp.name} (${emp.email}) from your company team? This cannot be undone.`)) {
      return;
    }
    setUpdating(emp.id);
    try {
      const res = await fetch(`/api/employees?userId=${emp.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
      showToast(`${emp.name} has been removed from team.`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const admins = employees.filter((e) => e.role === "ADMIN");
  const agents = employees.filter((e) => e.role === "AGENT");

  return (
    <>
      {showInvite && <InviteEmployeeModal onClose={() => setShowInvite(false)} onInvited={fetchEmployees} />}

      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <UserCog className="h-6 w-6 text-indigo-600" /> Team & Permission Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Control which employees can view all leads, create leads, or act as admins
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={fetchEmployees}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
            </Button>
            <Button size="sm" onClick={() => setShowInvite(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add New Member
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-2xs">
            <p className="text-2xl font-black text-indigo-600">{employees.length}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Total Members</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-2xs">
            <p className="text-2xl font-black text-amber-600">{admins.length}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Admins / Managers</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-2xs">
            <p className="text-2xl font-black text-emerald-600">{agents.length}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Field Agents</p>
          </div>
        </div>

        {/* Members List */}
        {employees.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700">No team members added yet</p>
            <p className="text-sm text-slate-500 mt-1">Click "Add New Member" to invite your employees.</p>
            <Button className="mt-4 bg-indigo-600" size="sm" onClick={() => setShowInvite(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Member
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {employees.map((emp) => {
              const isSelf =
                (currentUserId && emp.id === currentUserId) ||
                (currentUserEmail && emp.email.toLowerCase() === currentUserEmail.toLowerCase());

              return (
                <div
                  key={emp.id}
                  className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs transition-all ${
                    updating === emp.id ? "opacity-60" : ""
                  }`}
                >
                  {/* Top Row: User Avatar & Basic Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      {emp.avatarUrl ? (
                        <img
                          src={emp.avatarUrl}
                          alt={emp.name}
                          className="h-12 w-12 rounded-full object-cover flex-shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-700 font-bold text-base flex items-center justify-center flex-shrink-0">
                          {emp.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900">{emp.name}</h3>
                          {isSelf && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                              You (Owner)
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              emp.role === "ADMIN"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {emp.role === "ADMIN" ? (
                              <>
                                <Crown className="h-3 w-3" /> Admin
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3 w-3" /> Field Agent
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" /> {emp.email}
                        </p>
                      </div>
                    </div>

                    {/* Actions if not self */}
                    {!isSelf && (
                      <div className="flex items-center gap-2">
                        {/* Quick Role Switcher */}
                        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleSetRole(emp, "AGENT")}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${
                              emp.role === "AGENT"
                                ? "bg-white text-emerald-700 shadow-2xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Agent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetRole(emp, "ADMIN")}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${
                              emp.role === "ADMIN"
                                ? "bg-white text-amber-800 shadow-2xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Admin
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemove(emp)}
                          disabled={updating === emp.id}
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Detailed Permission Switches */}
                  {!isSelf ? (
                    <div className="pt-4 space-y-3">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Access & Lead Permissions for {emp.name}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Switch 1: View All Leads */}
                        <div
                          onClick={() => handleToggle(emp, "canViewAllLeads")}
                          className={`cursor-pointer rounded-xl border p-3.5 flex items-center justify-between transition-all select-none ${
                            emp.canViewAllLeads || emp.role === "ADMIN"
                              ? "bg-emerald-50/70 border-emerald-300"
                              : "bg-slate-50 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-lg mt-0.5 ${
                                emp.canViewAllLeads || emp.role === "ADMIN"
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              <Eye className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">View All Company Leads</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {emp.canViewAllLeads || emp.role === "ADMIN"
                                  ? "✅ Enabled: Can see ALL leads across company"
                                  : "🔒 Disabled: Can ONLY see leads assigned to him"}
                              </p>
                            </div>
                          </div>

                          {/* Toggle Switch Button */}
                          <div
                            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                              emp.canViewAllLeads || emp.role === "ADMIN" ? "bg-emerald-600" : "bg-slate-300"
                            }`}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                emp.canViewAllLeads || emp.role === "ADMIN" ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </div>
                        </div>

                        {/* Switch 2: Add Leads */}
                        <div
                          onClick={() => handleToggle(emp, "canAddLeads")}
                          className={`cursor-pointer rounded-xl border p-3.5 flex items-center justify-between transition-all select-none ${
                            emp.canAddLeads || emp.role === "ADMIN"
                              ? "bg-indigo-50/70 border-indigo-300"
                              : "bg-slate-50 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-lg mt-0.5 ${
                                emp.canAddLeads || emp.role === "ADMIN"
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              <Plus className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">Create / Add New Leads</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {emp.canAddLeads || emp.role === "ADMIN"
                                  ? "✅ Enabled: Can create new leads in CRM"
                                  : "🔒 Disabled: Blocked from adding leads"}
                              </p>
                            </div>
                          </div>

                          {/* Toggle Switch Button */}
                          <div
                            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                              emp.canAddLeads || emp.role === "ADMIN" ? "bg-indigo-600" : "bg-slate-300"
                            }`}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                emp.canAddLeads || emp.role === "ADMIN" ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50/70 px-3 py-2 rounded-xl mt-3">
                      <Shield className="h-4 w-4 text-indigo-600" />
                      <span>You have Full Company Administrator access to all features, settings and leads.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Permissions Guide Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-indigo-400" /> How Permissions Work in Practice
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <strong className="text-white block mb-1">👀 "View All Leads" OFF:</strong>
              When disabled, the agent logs in and only sees leads where they are the assigned agent. All other company leads are 100% hidden.
            </div>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <strong className="text-white block mb-1">➕ "Add Leads" OFF:</strong>
              When disabled, the agent cannot create leads or import lists. They can only work on existing leads assigned by the Admin.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
