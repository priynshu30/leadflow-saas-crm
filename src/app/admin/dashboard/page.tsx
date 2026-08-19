"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface StatsData {
  totalBusinesses: number;
  totalUsers: number;
  signupsThisWeek: number;
  activeToday: {
    businesses: number;
    users: number;
  };
  planCounts: Record<string, number>;
  recentLogins: Array<{
    id: number;
    email: string;
    success: boolean;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: string;
    business?: { name: string; status: string } | null;
    user?: { name: string; email: string } | null;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((res) => {
        setData(res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-slate-800 animate-pulse rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Control Plane Active
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Platform Super Admin Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-tenant health, subscriber metrics, and live login telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/businesses"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
          >
            <Building2 className="h-4 w-4" /> Manage Tenants
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Businesses */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-600 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Businesses
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white">{data.totalBusinesses}</span>
            <p className="text-[11px] text-slate-400 mt-1">Companies registered on platform</p>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-600 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total CRM Users
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white">{data.totalUsers}</span>
            <p className="text-[11px] text-slate-400 mt-1">Active sales agents & owners</p>
          </div>
        </div>

        {/* Signups This Week */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-600 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Signups This Week
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-400">+{data.signupsThisWeek}</span>
            <p className="text-[11px] text-slate-400 mt-1">New tenants in the last 7 days</p>
          </div>
        </div>

        {/* Active Today */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-600 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active in Last 24h
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{data.activeToday.businesses}</span>
              <span className="text-xs text-slate-400">tenants ({data.activeToday.users} users)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Logged in within last 24 hours</p>
          </div>
        </div>
      </div>

      {/* Plan Distribution & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Plans Breakdown */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-400" /> Subscription Tier Breakdown
            </h2>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: "Free Plan", count: data.planCounts.FREE || 0, color: "bg-slate-500" },
              { label: "Starter Plan", count: data.planCounts.STARTER || 0, color: "bg-blue-500" },
              { label: "Pro Plan", count: data.planCounts.PRO || 0, color: "bg-indigo-500" },
              { label: "Enterprise Plan", count: data.planCounts.ENTERPRISE || 0, color: "bg-purple-500" },
            ].map((plan) => {
              const pct = data.totalBusinesses > 0 ? Math.round((plan.count / data.totalBusinesses) * 100) : 0;
              return (
                <div key={plan.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-300">{plan.label}</span>
                    <span className="text-white">
                      {plan.count} <span className="text-slate-500 text-[11px]">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                    <div className={`h-full ${plan.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Login Telemetry Stream (2 cols) */}
        <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" /> Recent Live Logins
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time audit log of login attempts across platform</p>
            </div>
            <Link
              href="/admin/logins"
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              All Logs <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-700/50 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/60">
            {data.recentLogins.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No login activity recorded yet.</div>
            ) : (
              data.recentLogins.map((log) => (
                <div key={log.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                      log.success ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {log.success ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">{log.email}</span>
                        {log.business && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-[10px] text-indigo-300 font-medium">
                            {log.business.name}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5">
                        IP: {log.ipAddress || "127.0.0.1"} · {log.userAgent?.split(" ")[0] || "Browser"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      log.success ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800" : "bg-red-950/60 text-red-400 border border-red-800"
                    }`}>
                      {log.success ? "SUCCESS" : "FAILED"}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
