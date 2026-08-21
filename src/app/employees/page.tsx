"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, Shield, Eye, Plus, Trash2, Edit3, CheckCircle, XCircle, Crown, UserCheck, Mail, RefreshCw } from "lucide-react";
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
        setCurrentUserId(sData.user?.id);
      }
    } catch {
      showToast("Failed to load employees", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

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
      setEmployees((prev) => prev.map((e) => e.id === emp.id ? { ...e, ...data.user } : e));
      showToast("Employee updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (emp: Employee) => {
    if (!confirm(`Remove ${emp.name} from your team? This cannot be undone.`)) return;
    setUpdating(emp.id);
    try {
      const res = await fetch(`/api/employees?userId=${emp.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
      showToast(`${emp.name} has been removed.`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;
  }

  const admins = employees.filter((e) => e.role === "ADMIN");
  const agents = employees.filter((e) => e.role === "AGENT");

  return (
    <>
      {showInvite && <InviteEmployeeModal onClose={() => setShowInvite(false)} onInvited={fetchEmployees} />}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Team Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage your field agents, roles & permissions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={fetchEmployees}><RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh</Button>
            <Button size="sm" onClick={() => setShowInvite(true)}><Plus className="h-3.5 w-3.5 mr-1.5" /> Invite Agent</Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{employees.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total Members</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{admins.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Admins</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{agents.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Field Agents</p>
          </div>
        </div>

        {/* Employee List */}
        {employees.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600">No team members yet</p>
            <p className="text-sm text-slate-400 mt-1">Invite your first field agent to get started</p>
            <Button className="mt-4" size="sm" onClick={() => setShowInvite(true)}><Plus className="h-3.5 w-3.5 mr-1.5" /> Invite Agent</Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Users className="h-3.5 w-3.5" /> Team Members ({employees.length})
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <div key={emp.id} className={`p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-opacity ${updating === emp.id ? "opacity-60" : ""}`}>
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {emp.avatarUrl ? (
                      <img src={emp.avatarUrl} alt={emp.name} className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 flex-shrink-0">
                        {emp.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm text-slate-900 truncate">{emp.name}</p>
                        {emp.id === currentUserId && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full">You</span>
                        )}
                        {emp.role === "ADMIN" && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Crown className="h-2.5 w-2.5" /> Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" /> {emp.email}
                      </p>
                    </div>
                  </div>

                  {/* Permissions Toggles */}
                  {emp.id !== currentUserId && (
                    <div className="flex flex-wrap gap-2 items-center">
                      {/* Add Leads */}
                      <PermissionToggle
                        label="Add Leads"
                        icon={<Plus className="h-3 w-3" />}
                        enabled={emp.canAddLeads}
                        loading={updating === emp.id}
                        onClick={() => handleToggle(emp, "canAddLeads")}
                      />
                      {/* View All Leads */}
                      <PermissionToggle
                        label="View All Leads"
                        icon={<Eye className="h-3 w-3" />}
                        enabled={emp.canViewAllLeads}
                        loading={updating === emp.id}
                        onClick={() => handleToggle(emp, "canViewAllLeads")}
                      />
                      {/* Role Toggle */}
                      <PermissionToggle
                        label={emp.role === "ADMIN" ? "Admin" : "Make Admin"}
                        icon={<Shield className="h-3 w-3" />}
                        enabled={emp.role === "ADMIN"}
                        loading={updating === emp.id}
                        onClick={() => handleToggle(emp, "role")}
                        colorClass={emp.role === "ADMIN" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-600 border-slate-200"}
                      />
                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(emp)}
                        disabled={updating === emp.id}
                        className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50">
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  )}

                  {emp.id === currentUserId && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[11px] text-slate-400 italic">Your account</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Permissions Legend */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Permission Guide</p>
          <div className="space-y-1.5 text-xs text-blue-700">
            <div className="flex items-start gap-2"><UserCheck className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> <span><strong>Add Leads</strong> — Agent can create new leads (requires this permission, Admins always can)</span></div>
            <div className="flex items-start gap-2"><Eye className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> <span><strong>View All Leads</strong> — Agent can see all company leads (without this, they only see their own)</span></div>
            <div className="flex items-start gap-2"><Crown className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> <span><strong>Admin</strong> — Full access to reports, team management, all attendance data</span></div>
          </div>
        </div>
      </div>
    </>
  );
}

function PermissionToggle({
  label, icon, enabled, loading, onClick, colorClass,
}: {
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  loading: boolean;
  onClick: () => void;
  colorClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${colorClass || (enabled ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200")}`}
    >
      {icon}
      {label}
      {enabled
        ? <CheckCircle className="h-3 w-3 ml-0.5" />
        : <XCircle className="h-3 w-3 ml-0.5 opacity-50" />
      }
    </button>
  );
}
