"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  KeyRound,
  Search,
  ShieldCheck,
  ShieldAlert,
  Building2,
  RefreshCw,
  Filter,
  Calendar,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface LoginLogItem {
  id: number;
  userId: number | null;
  businessId: number | null;
  email: string;
  success: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  business?: { id: number; name: string; status: string } | null;
  user?: { id: number; name: string; email: string } | null;
}

export default function AdminLoginsPage() {
  const [logs, setLogs] = useState<LoginLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [successFilter, setSuccessFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogins = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
      });
      if (search.trim()) params.set("search", search.trim());
      if (successFilter === "SUCCESS") params.set("success", "true");
      if (successFilter === "FAILED") params.set("success", "false");

      const res = await fetch(`/api/admin/logins?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [page, search, successFilter]);

  useEffect(() => {
    fetchLogins();
  }, [fetchLogins]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Platform Login Logs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit trail of every single login attempt (successful & failed) across the entire platform
          </p>
        </div>

        <button
          onClick={fetchLogins}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Filter by email, IP address, company name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={successFilter}
            onChange={(e) => {
              setSuccessFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Attempts</option>
            <option value="SUCCESS">Success Only (✓)</option>
            <option value="FAILED">Failed Only (✗)</option>
          </select>
        </div>
      </div>

      {/* Login Logs Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Email Attempted</th>
                <th className="px-5 py-3.5">Company / Business</th>
                <th className="px-5 py-3.5">IP Address</th>
                <th className="px-5 py-3.5">Client / User Agent</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading login logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <KeyRound className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                    No login attempts recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-700/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          log.success
                            ? "bg-emerald-950/70 text-emerald-400 border-emerald-800"
                            : "bg-red-950/70 text-red-400 border-red-800"
                        }`}
                      >
                        {log.success ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                        {log.success ? "SUCCESS" : "FAILED"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-white font-mono">
                      {log.email}
                    </td>
                    <td className="px-5 py-3.5">
                      {log.business ? (
                        <Link
                          href={`/admin/businesses/${log.business.id}`}
                          className="font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
                        >
                          <Building2 className="h-3.5 w-3.5" /> {log.business.name}
                        </Link>
                      ) : (
                        <span className="text-slate-500 italic">Unregistered / SuperAdmin</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-mono">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 truncate max-w-xs text-[11px]">
                      {log.userAgent || "Unknown Client"}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-400 font-mono text-[11px]">
                      {formatDateTime(log.createdAt)}
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
