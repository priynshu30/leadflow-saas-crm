"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Lock, Mail, Building2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      showToast("Logged in successfully!", "success");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      showToast(err.message || "Invalid credentials", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-base shadow-sm">
            LF
          </div>
          <span className="font-bold text-2xl text-slate-900 tracking-tight">LeadFlow</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign in to your CRM</h2>
        <p className="mt-1 text-xs text-slate-500">
          Multi-tenant sales CRM built for local businesses in India
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm rounded-2xl border border-slate-200">
          <form className="space-y-4" onSubmit={handleLogin}>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                required
              />
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Sign In <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          {/* Quick Demo Accounts for Testing Multi-Tenancy */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider text-center">
              1-Click Login Accounts
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@gmail.com");
                  setPassword("Root@123");
                }}
                className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 text-left transition-all"
              >
                <span className="font-bold text-xs text-indigo-900 block truncate">⚡ Priyanshu Kumar</span>
                <span className="text-[10px] text-indigo-700 block">admin@gmail.com</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("amit@apexrealty.in");
                  setPassword("password123");
                }}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-all"
              >
                <span className="font-bold text-xs text-slate-900 block truncate">🏢 Apex Realty</span>
                <span className="text-[10px] text-slate-600 block">amit@apexrealty.in</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500 space-y-3">
            <div>
              Don't have a business account?{" "}
              <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 underline">
                Create one in 30 seconds
              </Link>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <span>🛡️ Platform Super Admin Access</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
