"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Camera,
  MapPin,
  CalendarHeart,
  Menu,
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

  const handleOpenDrawer = () => {
    window.dispatchEvent(new Event("open-mobile-drawer"));
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1.5 shadow-lg safe-area-pb">
      <div className="flex items-center justify-around relative">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[9px] font-medium transition-colors",
            isTabActive("/dashboard") ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <LayoutDashboard className="h-5 w-5 mb-0.5" />
          <span>Home</span>
        </Link>

        {/* Leads */}
        <Link
          href="/leads"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[9px] font-medium transition-colors",
            isTabActive("/leads") ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <Users className="h-5 w-5 mb-0.5" />
          <span>Leads</span>
        </Link>

        {/* Field Visits */}
        <Link
          href="/visits"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[9px] font-medium transition-colors",
            isTabActive("/visits") ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <MapPin className="h-5 w-5 mb-0.5" />
          <span>Visits</span>
        </Link>

        {/* Leaves */}
        <Link
          href="/leaves"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[9px] font-medium transition-colors",
            isTabActive("/leaves") ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <CalendarHeart className="h-5 w-5 mb-0.5" />
          <span>Leaves</span>
        </Link>

        {/* Menu (Opens Full Mobile Drawer) */}
        <button
          type="button"
          onClick={handleOpenDrawer}
          className="flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[9px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <Menu className="h-5 w-5 mb-0.5" />
          <span>Menu</span>
        </button>
      </div>
    </div>
  );
};
