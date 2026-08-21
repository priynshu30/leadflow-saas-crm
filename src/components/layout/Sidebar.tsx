"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  BarChart3,
  Settings,
  Plus,
  LogOut,
  Building2,
  PhoneCall,
  Inbox,
  Camera,
  UserCog,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionUser } from "@/types";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface SidebarProps {
  user: SessionUser | null;
  onOpenQuickAdd: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onOpenQuickAdd }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const isAdmin = (user as any)?.role === "ADMIN";

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Leads", href: "/leads", icon: Users },
    { label: "Follow-ups", href: "/follow-ups", icon: CalendarClock },
    { label: "Field Visits", href: "/visits", icon: MapPin },
    { label: "Attendance", href: "/attendance", icon: Camera },
    ...(isAdmin ? [{ label: "Team", href: "/employees", icon: UserCog }] : []),
    { label: "Inbox", href: "/inbox", icon: Inbox },
    ...(isAdmin ? [{ label: "Reports", href: "/reports", icon: BarChart3 }] : []),
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm font-bold">
            LF
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">LeadFlow</h1>
            <p className="text-[11px] text-slate-500 font-medium">Never Miss a Follow-up</p>
          </div>
        </div>
        <NotificationBell />
      </div>

      {/* Tenant / Business Info Pill */}
      {user && (
        <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">{user.businessName}</p>
            <p className="text-[10px] text-slate-500 capitalize truncate">
              {user.businessType?.replace(/_/g, " ").toLowerCase() || "Business"}
            </p>
          </div>
        </div>
      )}

      {/* Quick Add Button */}
      <div className="p-3">
        <button
          onClick={onOpenQuickAdd}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Quick Add Lead</span>
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Icon
                className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-600" : "text-slate-400")}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User / Logout Footer */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold uppercase shrink-0 overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span>{user?.name?.[0] || "U"}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || "User"}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
