"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { BUSINESS_TYPE_LABELS } from "@/lib/constants";
import { BusinessType } from "@/types";
import { Building2, User, Mail, Lock, Phone, ArrowRight, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("REAL_ESTATE");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const currentPreset = BUSINESS_TYPE_LABELS[businessType];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !name || !email || !password) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          businessType,
          name,
          email,
          phone,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      showToast("Business registered successfully!", "success");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      showToast(err.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-base shadow-sm">
            LF
          </div>
          <span className="font-bold text-2xl text-slate-900 tracking-tight">LeadFlow</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Set Up Your Multi-Tenant CRM</h2>
        <p className="mt-1 text-xs text-slate-500">
          Tailored fields for property, cars, insurance, interiors, solar, education, & more
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm rounded-2xl border border-slate-200">
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 mb-2">
              <h3 className="text-xs font-bold text-indigo-900 mb-2">1. Select Your Business Niche</h3>
              <Select
                label="Business Vertical / Type"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                options={Object.entries(BUSINESS_TYPE_LABELS).map(([key, val]) => ({
                  value: key,
                  label: val.name,
                }))}
              />
              <div className="mt-3 text-[11px] text-indigo-800">
                <span className="font-semibold">Automatic Field Presets:</span> {currentPreset.field1}, {currentPreset.field2}, {currentPreset.field3}, {currentPreset.field4}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Business / Company Name"
                placeholder="e.g. Apex Realty"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                leftIcon={<Building2 className="h-4 w-4" />}
                required
              />
              <Input
                label="Business Phone"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="h-4 w-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Your Full Name"
                placeholder="e.g. Amit Verma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="h-4 w-4" />}
                required
              />
              <Input
                label="Login Email"
                type="email"
                placeholder="amit@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                required
              />
            </div>

            <Input
              label="Account Password"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              required
            />

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Create CRM Workspace <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
