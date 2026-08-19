"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { LeadTable } from "@/components/leads/LeadTable";
import { LeadCard } from "@/components/leads/LeadCard";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { Button } from "@/components/ui/Button";
import { ExcelImportModal } from "@/components/leads/ExcelImportModal";
import { LeadWithRelations } from "@/types";
import { Plus, Users, LayoutGrid, List, FileSpreadsheet } from "lucide-react";

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number }>({
    total: 0,
    totalPages: 1,
  });
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "25");
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      if (source) params.set("source", source);

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, source]);

  useEffect(() => {
    fetchLeads();
    const handleLeadAdded = () => fetchLeads();
    window.addEventListener("lead-added", handleLeadAdded);
    return () => window.removeEventListener("lead-added", handleLeadAdded);
  }, [fetchLeads]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leads</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {pagination.total} leads in database
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle (desktop) */}
          <div className="hidden sm:flex items-center rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "table" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            className="hidden sm:inline-flex"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-600" /> Import Excel
          </Button>

          <Link href="/leads/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" /> Add Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <LeadFilters
        search={search}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
        status={status}
        onStatusChange={(st) => {
          setStatus(st);
          setPage(1);
        }}
        source={source}
        onSourceChange={(src) => {
          setSource(src);
          setPage(1);
        }}
        onReset={() => {
          setSearch("");
          setStatus("");
          setSource("");
          setPage(1);
        }}
      />

      {/* Content */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6 text-indigo-600" />}
          title={search || status || source ? "No matching leads found" : "No leads in your CRM yet"}
          description={
            search || status || source
              ? "Try adjusting your search terms or filters to find what you're looking for."
              : "Capture prospects directly with the Quick Add button or create a detailed lead entry."
          }
          actionLabel="Add Lead"
          onAction={() => {
            window.dispatchEvent(new CustomEvent("open-quick-add"));
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Mobile view: always cards. Desktop: Table or Grid */}
          <div className="block sm:hidden space-y-3">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>

          <div className="hidden sm:block">
            {viewMode === "table" ? (
              <LeadTable leads={leads} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Page {page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchLeads}
      />
    </div>
  );
}
