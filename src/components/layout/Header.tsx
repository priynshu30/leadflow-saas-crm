"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, LogOut, User, Settings, Building2, ChevronDown, ShieldCheck } from "lucide-react";
import { SessionUser } from "@/types";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface HeaderProps {
  user: SessionUser | null;
  onOpenQuickAdd: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ user, onOpenQuickAdd, title }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (e) {
      window.location.href = "/login";
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile Brand indicator */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-xs">
            LF
          </div>
          <span className="font-bold text-slate-900 text-sm truncate max-w-[140px]">
            {user?.businessName || "LeadFlow"}
          </span>
        </div>

        {/* Desktop Page Title */}
        {title && <h1 className="hidden lg:block text-lg font-bold text-slate-900 tracking-tight">{title}</h1>}
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Add header button on tablets / desktop */}
        <button
          onClick={onOpenQuickAdd}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 active:scale-[0.98] shadow-xs transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Quick Add</span>
        </button>

        {/* Theme Toggle (Dark / Light) */}
        <ThemeToggle />

        {/* Notification Bell */}
        <NotificationBell />

        {/* Standard SaaS User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-left shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            aria-label="User menu"
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center text-xs font-bold uppercase shadow-2xs overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span>{user?.name?.[0] || "U"}</span>
              )}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[110px]">
                {user?.name || "My Account"}
              </p>
              <p className="text-[10px] text-slate-500 truncate max-w-[110px]">
                {user?.businessName || "Admin"}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User Details Header */}
              <div className="px-4 py-3.5 bg-slate-50/80 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-bold uppercase shadow-xs overflow-hidden">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{user?.name?.[0] || "U"}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.name || "User"}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-100 text-indigo-700">
                        <Building2 className="h-2.5 w-2.5" />
                        <span className="truncate max-w-[120px]">{user?.businessName || "Business"}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Links */}
              <div className="p-1.5 space-y-0.5">
                <Link
                  href="/settings/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  <span>My Profile</span>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  <span>Business Settings</span>
                </Link>
              </div>

              {/* Logout Button */}
              <div className="p-1.5 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-rose-500" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


