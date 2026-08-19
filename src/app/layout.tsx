import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "LeadFlow — Multi-Tenant SaaS CRM for Local Businesses",
  description: "Never miss a follow-up. A fast, multi-niche sales CRM built for local businesses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
