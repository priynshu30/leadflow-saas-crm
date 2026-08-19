"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileTabBarProps {
  onOpenQuickAdd: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ onOpenQuickAdd }) => {
  const pathname = usePathname();

  const isTabActive = (path: string) => {
    return pathname === path || (path !== "/dashboard" && pathname.startsWith(path));
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg safe-area-pb">
      <div className="flex items-center justify-around relative">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors",
            isTabActive("/dashboard") ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <LayoutDashboard className="h-5 w-5 mb-0.5" />
          <span>Dashboard</span>
        </Link>

        {/* Leads */}
        <Link
          href="/leads"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors",
            isTabActive("/leads") ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <Users className="h-5 w-5 mb-0.5" />
          <span>Leads</span>
        </Link>

        {/* Center Raised Quick Add */}
        <div className="relative -top-4">
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 text-white shadow-lg ring-4 ring-slate-50 active:scale-95 transition-transform"
            aria-label="Quick Add Lead"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Follow-ups */}
        <Link
          href="/follow-ups"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors",
            isTabActive("/follow-ups") ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <CalendarClock className="h-5 w-5 mb-0.5" />
          <span>Follow-ups</span>
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors",
            isTabActive("/settings") ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <Settings className="h-5 w-5 mb-0.5" />
          <span>More</span>
        </Link>
      </div>
    </div>
  );
};
