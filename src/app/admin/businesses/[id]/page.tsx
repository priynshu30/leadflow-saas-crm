"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Users,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  UserCheck,
} from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

interface BusinessDetail {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  businessType: string;
  status: "ACTIVE" | "SUSPENDED";
  plan: string;
  totalLeads: number;
  totalUsers: number;
  createdAt: string;
  updatedAt: string;
  users: Array<{
    id: number;
    name: string;
    email: string;
    phone: string | null;
    totalLogins: number;
    assignedLeads: number;
    lastLoginAt: string | null;
    createdAt: string;
  }>;
}

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params?.id as string;

  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/admin/businesses/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBusiness(data.business);
      } else {
        showToast("Business not found", "error");
      }
    } catch {
      showToast("Failed to load business details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!business) return;
    const nextStatus = business.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const confirmMsg =
      nextStatus === "SUSPENDED"
        ? `Are you sure you want to SUSPEND "${business.name}"? All users from this company will be blocked from logging in immediately.`
        : `Reactivate "${business.name}"? Users will be able to log in again.`;

    if (!confirm(confirmMsg)) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        showToast(
          nextStatus === "SUSPENDED" ? "Account suspended!" : "Account reactivated!",
          "success"
        );
        fetchDetail();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to update status", "error");
      }
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePlan = async (newPlan: string) => {
    if (!business) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });

      if (res.ok) {
        showToast(`Subscription plan updated to ${newPlan}`, "success");
        fetchDetail();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to update plan", "error");
      }
    } catch {
      showToast("Failed to update plan", "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !business) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-slate-800 animate-pulse rounded-2xl" />
        <div className="h-64 bg-slate-800 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/businesses"
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            {business.name}
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                business.status === "ACTIVE"
                  ? "bg-emerald-950/70 text-emerald-400 border-emerald-800"
                  : "bg-red-950/70 text-red-400 border-red-800"
              }`}
            >
              {business.status}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered on {formatDate(business.createdAt)} · Industry:{" "}
            <span className="capitalize">{business.businessType.replace(/_/g, " ").toLowerCase()}</span>
          </p>
        </div>
      </div>

      {/* Control Banner: Suspend/Reactivate & Plan Selection */}
      <div className="bg-slate-800/90 border border-slate-700 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Platform Account Controls
          </span>
          <p className="text-sm font-semibold text-slate-200">
            {business.status === "ACTIVE"
              ? "Account is in good standing. Users can login and manage leads."
              : "Account is SUSPENDED. All team members are blocked from logging in."}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Plan Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
            <CreditCard className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300">Plan:</span>
            <select
              value={business.plan || "FREE"}
              onChange={(e) => handleUpdatePlan(e.target.value)}
              disabled={updating}
              className="bg-transparent text-xs font-bold text-indigo-300 focus:outline-none cursor-pointer"
            >
              <option value="FREE" className="bg-slate-900 text-white">FREE</option>
              <option value="STARTER" className="bg-slate-900 text-white">STARTER</option>
              <option value="PRO" className="bg-slate-900 text-white">PRO</option>
              <option value="ENTERPRISE" className="bg-slate-900 text-white">ENTERPRISE</option>
            </select>
          </div>

          {/* Suspend / Reactivate Action */}
          <button
            onClick={handleToggleStatus}
            disabled={updating}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              business.status === "ACTIVE"
                ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/20"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
            }`}
          >
            {business.status === "ACTIVE" ? "⚠️ Suspend Business" : "✓ Reactivate Business"}
          </button>
        </div>
      </div>

      {/* Meta Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Leads Stored</span>
          <p className="text-2xl font-black text-indigo-400 mt-2">{business.totalLeads}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Team Members</span>
          <p className="text-2xl font-black text-white mt-2">{business.totalUsers}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact Email</span>
          <p className="text-sm font-semibold text-slate-200 mt-2 truncate font-mono">{business.email || "No email"}</p>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-400" /> Registered Team Members ({business.users.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Agent Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-center">Assigned Leads</th>
                <th className="px-4 py-3 text-center">Total Logins</th>
                <th className="px-4 py-3">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {business.users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-white flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-indigo-400" /> {u.name}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-300">{u.email}</td>
                  <td className="px-4 py-3.5 text-slate-400">{u.phone || "—"}</td>
                  <td className="px-4 py-3.5 text-center font-bold text-indigo-300">{u.assignedLeads}</td>
                  <td className="px-4 py-3.5 text-center font-bold text-white">{u.totalLogins}</td>
                  <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                    {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
