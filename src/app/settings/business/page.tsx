"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { BUSINESS_TYPE_LABELS } from "@/lib/constants";
import { BusinessType } from "@/types";
import { ArrowLeft, Save, Building2, SlidersHorizontal, RefreshCw } from "lucide-react";

export default function BusinessSettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("REAL_ESTATE");
  const [field1Label, setField1Label] = useState("");
  const [field2Label, setField2Label] = useState("");
  const [field3Label, setField3Label] = useState("");
  const [field4Label, setField4Label] = useState("");
  const [defaultCountryCode, setDefaultCountryCode] = useState("91");

  useEffect(() => {
    fetch("/api/settings/business")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          const s = data.settings;
          setName(s.name || "");
          setPhone(s.phone || "");
          setEmail(s.email || "");
          setAddress(s.address || "");
          setBusinessType(s.businessType || "OTHER");
          setField1Label(s.field1Label || "");
          setField2Label(s.field2Label || "");
          setField3Label(s.field3Label || "");
          setField4Label(s.field4Label || "");
          setDefaultCountryCode(s.defaultCountryCode || "91");
        }
      })
      .catch(() => showToast("Failed to load settings", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleApplyPresets = () => {
    const preset = BUSINESS_TYPE_LABELS[businessType];
    if (preset) {
      setField1Label(preset.field1);
      setField2Label(preset.field2);
      setField3Label(preset.field3);
      setField4Label(preset.field4);
      showToast(`Loaded ${preset.name} field defaults`, "info");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          businessType,
          field1Label: field1Label.trim() || null,
          field2Label: field2Label.trim() || null,
          field3Label: field3Label.trim() || null,
          field4Label: field4Label.trim() || null,
          defaultCountryCode: defaultCountryCode.trim() || "91",
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      showToast("Business settings updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-64 bg-slate-200 animate-pulse rounded-xl" />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Profile & Niche Customization</h1>
          <p className="text-xs text-slate-500 mt-0.5">Customize company details and rename generic requirement labels</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSave} className="space-y-6">
          {/* Company Details */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Company Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company / Brand Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Official Contact Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Official Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Default Country Calling Code"
                value={defaultCountryCode}
                onChange={(e) => setDefaultCountryCode(e.target.value)}
                placeholder="91"
              />
            </div>
            <Input
              label="Office / Store Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Sector 18, Noida, Uttar Pradesh"
            />
          </div>

          {/* Industry Vertical & Custom Field Labels */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Niche Requirement Fields (Generic Multi-Vertical)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rename these 4 labels to match your specific sales vocabulary
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={handleApplyPresets}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reset to Vertical Defaults
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Select
                label="Business Vertical"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                options={Object.entries(BUSINESS_TYPE_LABELS).map(([key, val]) => ({
                  value: key,
                  label: val.name,
                }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <Input
                label="Field 1 Label"
                value={field1Label}
                onChange={(e) => setField1Label(e.target.value)}
                placeholder="e.g. Property Type / Car Model / Course"
              />
              <Input
                label="Field 2 Label"
                value={field2Label}
                onChange={(e) => setField2Label(e.target.value)}
                placeholder="e.g. Location / Budget / Batch"
              />
              <Input
                label="Field 3 Label"
                value={field3Label}
                onChange={(e) => setField3Label(e.target.value)}
                placeholder="e.g. Bedrooms / Condition / Package"
              />
              <Input
                label="Field 4 Label"
                value={field4Label}
                onChange={(e) => setField4Label(e.target.value)}
                placeholder="e.g. Budget / Fuel Type / Timeline"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link href="/settings">
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={saving} size="lg">
              <Save className="h-4 w-4 mr-1.5" /> Save Settings
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
