"use client";

import React from "react";
import { Plus, Search, Building2 } from "lucide-react";
import { SessionUser } from "@/types";

interface HeaderProps {
  user: SessionUser | null;
  onOpenQuickAdd: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ user, onOpenQuickAdd, title }) => {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile Brand indicator */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
            LF
          </div>
          <span className="font-bold text-slate-900 text-sm">{user?.businessName || "LeadFlow"}</span>
        </div>

        {/* Desktop Page Title */}
        {title && <h1 className="hidden lg:block text-lg font-bold text-slate-900 tracking-tight">{title}</h1>}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Quick Add header button on tablets / desktop */}
        <button
          onClick={onOpenQuickAdd}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 active:scale-[0.98] shadow-2xs transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Quick Add</span>
        </button>
      </div>
    </header>
  );
};
