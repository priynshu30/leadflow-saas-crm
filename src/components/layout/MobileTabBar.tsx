"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  Plus,
  Camera,
  MapPin,
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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1.5 shadow-lg safe-area-pb">
      <div className="flex items-center justify-around relative">
        {/* Dashboard */}
        <Link href="/dashboard" className={cn("flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[9px] font-medium transition-colors", isTabActive("/dashboard") ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-900")}>
          <LayoutDashboard className="h-5 w-5 mb-0.5" />
          <span>Home</span>
        </Link>

        {/* Leads */}
        <Link href="/leads" className={cn("flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[9px] font-medium transition-colors", isTabActive("/leads") ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-900")}>
          <Users className="h-5 w-5 mb-0.5" />
          <span>Leads</span>
        </Link>

        {/* Field Visits */}
        <Link href="/visits" className={cn("flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[9px] font-medium transition-colors", isTabActive("/visits") ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-900")}>
          <MapPin className="h-5 w-5 mb-0.5" />
          <span>Visits</span>
        </Link>

        {/* Attendance */}
        <Link href="/attendance" className={cn("flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[9px] font-medium transition-colors", isTabActive("/attendance") ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-900")}>
          <Camera className="h-5 w-5 mb-0.5" />
          <span>Attendance</span>
        </Link>

        {/* Settings */}
        <Link href="/settings" className={cn("flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[9px] font-medium transition-colors", isTabActive("/settings") ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-900")}>
          <Settings className="h-5 w-5 mb-0.5" />
          <span>More</span>
        </Link>
      </div>
    </div>
  );
};
