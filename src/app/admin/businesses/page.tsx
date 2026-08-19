"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Users,
  Calendar,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/utils";

interface BusinessItem {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  businessType: string;
  status: "ACTIVE" | "SUSPENDED";
  plan: string;
  userCount: number;
  leadCount: number;
  owner: { name: string; email: string } | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (planFilter !== "ALL") params.set("plan", planFilter);

      const res = await fetch(`/api/admin/businesses?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, planFilter]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Tenant Businesses
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor registered companies, view lead volumes, and manage subscription/suspension state
          </p>
        </div>

        <button
          onClick={fetchBusinesses}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search by company name, email, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Plans</option>
            <option value="FREE">Free</option>
            <option value="STARTER">Starter</option>
            <option value="PRO">Pro</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Businesses Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-5 py-3.5">Business Name & Industry</th>
                <th className="px-5 py-3.5">Primary Contact / Owner</th>
                <th className="px-5 py-3.5">Plan</th>
                <th className="px-5 py-3.5 text-center">Users</th>
                <th className="px-5 py-3.5 text-center">Total Leads</th>
                <th className="px-5 py-3.5">Last Login</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading tenants...
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                    No businesses matching your criteria.
                  </td>
                </tr>
              ) : (
                businesses.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-700/40 transition-colors group cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <Link href={`/admin/businesses/${b.id}`} className="block">
                        <span className="font-bold text-white group-hover:text-indigo-400 transition-colors text-sm">
                          {b.name}
                        </span>
                        <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                          {b.businessType.replace(/_/g, " ").toLowerCase()}
                        </p>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-200">{b.owner?.name || "—"}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{b.owner?.email || b.email || "—"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-extrabold uppercase tracking-wide text-indigo-300">
                        {b.plan || "FREE"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-slate-200">
                      {b.userCount}
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-indigo-400">
                      {b.leadCount}
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-[11px]">
                      {b.lastLoginAt ? formatDateTime(b.lastLoginAt) : "Never"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          b.status === "ACTIVE"
                            ? "bg-emerald-950/70 text-emerald-400 border-emerald-800"
                            : "bg-red-950/70 text-red-400 border-red-800"
                        }`}
                      >
                        {b.status === "ACTIVE" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/businesses/${b.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                      >
                        Manage <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 bg-slate-900 border-t border-slate-700 text-xs text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
