"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users, Search, Building2, Clock, RefreshCw, KeyRound, ExternalLink } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface AdminUserItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  businessId: number;
  businessName: string;
  businessStatus: "ACTIVE" | "SUSPENDED";
  businessPlan: string;
  totalLogins: number;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
      });
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            All Platform Users
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Flat overview of all sales agents, owners, and admins across every tenant
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search by user name, email, phone, or company name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-5 py-3.5">User Name</th>
                <th className="px-5 py-3.5">Email Address</th>
                <th className="px-5 py-3.5">Company / Business</th>
                <th className="px-5 py-3.5 text-center">Total Logins</th>
                <th className="px-5 py-3.5">Last Login Time</th>
                <th className="px-5 py-3.5 text-right">Tenant Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading platform users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <Users className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                    No users found matching search.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-700/40 transition-colors">
                    <td className="px-5 py-4 font-bold text-white">
                      {u.name}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-300">
                      {u.email}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/businesses/${u.businessId}`}
                        className="font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
                      >
                        <Building2 className="h-3.5 w-3.5" /> {u.businessName}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-white">
                      {u.totalLogins}
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.businessStatus === "ACTIVE"
                            ? "bg-emerald-950/70 text-emerald-400 border-emerald-800"
                            : "bg-red-950/70 text-red-400 border-red-800"
                        }`}
                      >
                        {u.businessStatus}
                      </span>
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
