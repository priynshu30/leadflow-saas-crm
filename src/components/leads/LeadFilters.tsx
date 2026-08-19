"use client";

import React from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Search, Filter, X } from "lucide-react";
import { LeadStatus } from "@/types";
import { COMMON_LEAD_SOURCES } from "@/lib/constants";

interface LeadFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  source: string;
  onSourceChange: (val: string) => void;
  onReset: () => void;
}

export const LeadFilters: React.FC<LeadFiltersProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  source,
  onSourceChange,
  onReset,
}) => {
  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "NEW", label: "New" },
    { value: "CONTACTED", label: "Contacted" },
    { value: "INTERESTED", label: "Interested" },
    { value: "FOLLOW_UP", label: "Follow Up" },
    { value: "SITE_VISIT", label: "Site Visit / Meeting" },
    { value: "CONVERTED", label: "Converted" },
    { value: "LOST", label: "Lost" },
  ];

  const sourceOptions = [
    { value: "", label: "All Sources" },
    ...COMMON_LEAD_SOURCES.map((s) => ({ value: s, label: s })),
  ];

  const hasFilters = search || status || source;

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs mb-5">
      <div className="relative w-full sm:w-80">
        <Input
          placeholder="Search by name, phone, details..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
        <div className="w-full sm:w-44">
          <Select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            options={statusOptions}
          />
        </div>

        <div className="w-full sm:w-44">
          <Select
            value={source}
            onChange={(e) => onSourceChange(e.target.value)}
            options={sourceOptions}
          />
        </div>

        {hasFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="Reset filters"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
