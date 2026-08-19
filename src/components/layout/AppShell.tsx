"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { MobileTabBar } from "./MobileTabBar";
import { Header } from "./Header";
import { QuickAddModal } from "@/components/ui/QuickAddModal";
import { ToastProvider } from "@/components/ui/Toast";
import { SessionUser } from "@/types";
import { usePathname, useRouter } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    isAdminRoute;

  useEffect(() => {
    if (!isAuthPage) {
      fetch("/api/auth/me")
        .then((res) => {
          if (!res.ok) {
            router.push("/login");
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data?.user) {
            setUser(data.user);
          }
        })
        .catch(() => {
          router.push("/login");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [pathname, isAuthPage, router]);

  if (isAuthPage) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900">
        {/* Desktop Sidebar */}
        <Sidebar user={user} onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-6">
          <Header user={user} onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
            {children}
          </main>
        </div>

        {/* Mobile Tab Bar */}
        <MobileTabBar onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

        {/* Quick Add Modal */}
        <QuickAddModal
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
          onLeadAdded={() => {
            window.dispatchEvent(new Event("lead-added"));
            router.refresh();
          }}
        />
      </div>
    </ToastProvider>
  );
};
