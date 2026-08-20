"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { LeadTable } from "@/components/leads/LeadTable";
import { LeadCard } from "@/components/leads/LeadCard";
import { KanbanBoard } from "@/components/leads/KanbanBoard";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { Button } from "@/components/ui/Button";
import { ExcelImportModal } from "@/components/leads/ExcelImportModal";
import { WhatsAppTemplateModal } from "@/components/leads/WhatsAppTemplateModal";
import { useToast } from "@/components/ui/Toast";
import { LeadWithRelations, LeadStatus } from "@/types";
import {
  Plus,
  Users,
  LayoutGrid,
  List,
  Kanban,
  FileSpreadsheet,
  Download,
} from "lucide-react";

export default function LeadsPage() {
  const { showToast } = useToast();
  const [leads, setLeads] = useState<LeadWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [whatsAppModalLead, setWhatsAppModalLead] = useState<LeadWithRelations | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number }>({
    total: 0,
    totalPages: 1,
  });
  const [viewMode, setViewMode] = useState<"table" | "grid" | "kanban">("table");

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      // Increase limit for Kanban to show full pipeline
      params.set("limit", viewMode === "kanban" ? "100" : "25");
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
  }, [page, search, status, source, viewMode]);

  useEffect(() => {
    fetchLeads();
    const handleLeadAdded = () => fetchLeads();
    window.addEventListener("lead-added", handleLeadAdded);
    return () => window.removeEventListener("lead-added", handleLeadAdded);
  }, [fetchLeads]);

  // Kanban Drag-and-drop status update
  const handleStatusChange = async (leadId: number, newStatus: LeadStatus) => {
    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update lead status");
      }
      showToast(`Lead moved to ${newStatus.replace(/_/g, " ")}`, "success");
    } catch (err: any) {
      showToast(err.message || "Status update failed", "error");
      fetchLeads(); // Revert on failure
    }
  };

  // 1-Click Excel Export
  const handleExportExcel = () => {
    if (leads.length === 0) {
      showToast("No leads to export", "error");
      return;
    }

    try {
      const exportData = leads.map((l) => ({
        "Lead ID": l.id,
        "Full Name": l.name,
        Phone: l.phone,
        Email: l.email || "N/A",
        Source: l.source || "N/A",
        Status: l.status,
        [l.field1Label || "Requirement"]: l.field1Value || "",
        [l.field2Label || "Location"]: l.field2Value || "",
        [l.field3Label || "Details"]: l.field3Value || "",
        [l.field4Label || "Budget"]: l.field4Value || "",
        "Next Followup": l.nextFollowupAt
          ? new Date(l.nextFollowupAt).toLocaleString("en-IN")
          : "None",
        "Created At": new Date(l.createdAt).toLocaleString("en-IN"),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
      XLSX.writeFile(workbook, `LeadFlow_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast("Exported leads to Excel successfully!", "success");
    } catch (e) {
      showToast("Failed to export Excel file", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leads & Pipeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {pagination.total} leads in database • Interactive Kanban Pipeline
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle (desktop & tablet) */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === "table"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Table View"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === "kanban"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Kanban Pipeline View"
            >
              <Kanban className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === "grid"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Grid</span>
            </button>
          </div>

          {/* Export to Excel */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            title="Download Excel Sheet"
            className="shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-indigo-600" /> Export Excel
          </Button>

          {/* Import Excel */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            className="hidden sm:inline-flex shadow-2xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> Import
          </Button>

          <Link href="/leads/new">
            <Button size="sm" className="shadow-2xs">
              <Plus className="h-4 w-4 mr-1.5" /> Add Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filters (Shown on Table/Grid or Kanban) */}
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
          {/* Kanban Pipeline View */}
          {viewMode === "kanban" ? (
            <KanbanBoard
              leads={leads}
              onStatusChange={handleStatusChange}
              onOpenWhatsAppModal={(lead) => setWhatsAppModalLead(lead)}
            />
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="block sm:hidden space-y-3">
                {leads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onOpenWhatsAppModal={(l) => setWhatsAppModalLead(l)}
                  />
                ))}
              </div>

              {/* Desktop View: Table or Grid */}
              <div className="hidden sm:block">
                {viewMode === "table" ? (
                  <LeadTable
                    leads={leads}
                    onOpenWhatsAppModal={(l) => setWhatsAppModalLead(l)}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onOpenWhatsAppModal={(l) => setWhatsAppModalLead(l)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Pagination (for table/grid) */}
          {viewMode !== "kanban" && pagination.totalPages > 1 && (
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

      {/* WhatsApp Template Modal */}
      <WhatsAppTemplateModal
        isOpen={!!whatsAppModalLead}
        onClose={() => setWhatsAppModalLead(null)}
        lead={whatsAppModalLead}
      />
    </div>
  );
}

