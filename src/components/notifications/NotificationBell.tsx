"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Mail, CalendarClock, AlertCircle, CheckCheck, X } from "lucide-react";

interface DbNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

interface SystemAlerts {
  overdueFollowUps: number;
  todayFollowUps: number;
}

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlerts>({ overdueFollowUps: 0, todayFollowUps: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setSystemAlerts(data.systemAlerts || { overdueFollowUps: 0, todayFollowUps: 0 });
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60s for new notifications
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    fetchNotifications();
  };

  const handleMarkOneRead = async (id: number) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    fetchNotifications();
  };

  const totalBadge = unreadCount + (systemAlerts.overdueFollowUps > 0 ? 1 : 0) + (systemAlerts.todayFollowUps > 0 ? 1 : 0);

  const getIcon = (type: string) => {
    switch (type) {
      case "EMAIL": return <Mail className="h-4 w-4 text-indigo-500" />;
      case "FOLLOW_UP": return <CalendarClock className="h-4 w-4 text-amber-500" />;
      default: return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen((o) => !o); if (!open) fetchNotifications(); }}
        className="relative p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-xs"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {totalBadge > 0 && (
          <span className="absolute -top-1 -right-1 h-4.5 min-w-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 shadow">
            {totalBadge > 9 ? "9+" : totalBadge}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden transition-all duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-600" />
              <span className="font-bold text-slate-900 text-sm">Notifications</span>
              {totalBadge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">{totalBadge} new</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 ml-1">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* System Alerts */}
          {(systemAlerts.overdueFollowUps > 0 || systemAlerts.todayFollowUps > 0) && (
            <div className="px-3 py-2 space-y-1.5 bg-amber-50 border-b border-amber-100">
              {systemAlerts.overdueFollowUps > 0 && (
                <Link href="/followups" onClick={() => setOpen(false)}>
                  <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
                    <div className="mt-0.5 shrink-0">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-red-700">{systemAlerts.overdueFollowUps} Overdue Follow-ups!</p>
                      <p className="text-[11px] text-red-600">These leads haven't been contacted — action needed now</p>
                    </div>
                  </div>
                </Link>
              )}
              {systemAlerts.todayFollowUps > 0 && (
                <Link href="/followups" onClick={() => setOpen(false)}>
                  <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
                    <div className="mt-0.5 shrink-0">
                      <CalendarClock className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-800">{systemAlerts.todayFollowUps} Follow-ups Due Today</p>
                      <p className="text-[11px] text-amber-700">Schedule your calls and WhatsApp messages</p>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* DB Notifications List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && handleMarkOneRead(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? "bg-indigo-50/50" : ""}`}
                >
                  <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-white border border-slate-100 shadow-2xs">
                    {getIcon(n.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-semibold text-slate-900 leading-snug ${!n.read ? "font-bold" : ""}`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="mt-0.5 shrink-0 h-2 w-2 rounded-full bg-indigo-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.createdAt).toLocaleString("en-IN", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
            <Link
              href="/inbox"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <Mail className="h-3.5 w-3.5" /> View Email Inbox
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
