"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { ExcelImportModal } from "@/components/leads/ExcelImportModal";
import { COMMON_LEAD_SOURCES } from "@/lib/constants";
import { ArrowLeft, Save, AlertCircle, ArrowRight, FileSpreadsheet } from "lucide-react";

export default function NewLeadPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [businessSettings, setBusinessSettings] = useState<any>(null);

  // Form
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [source, setSource] = useState("Direct Call");
  const [status, setStatus] = useState("NEW");
  const [field1Value, setField1Value] = useState("");
  const [field2Value, setField2Value] = useState("");
  const [field3Value, setField3Value] = useState("");
  const [field4Value, setField4Value] = useState("");
  const [notes, setNotes] = useState("");
  const [scheduleFollowup, setScheduleFollowup] = useState(true);
  const [followupDate, setFollowupDate] = useState("");
  const [followupTime, setFollowupTime] = useState("11:00");

  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings/business")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setBusinessSettings(data.settings);
      })
      .catch(() => {});

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFollowupDate(tomorrow.toISOString().split("T")[0]);
  }, []);

  const checkDuplicate = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setDuplicateWarning(null);
      return;
    }
    try {
      const res = await fetch(`/api/leads/check-duplicate?phone=${encodeURIComponent(phoneNumber)}`);
      const data = await res.json();
      if (data.duplicate) {
        setDuplicateWarning(data.duplicate);
      } else {
        setDuplicateWarning(null);
      }
    } catch (e) {}
  };

  const handleSubmit = async (e: React.FormEvent, ignoreDuplicate = false) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showToast("Name and phone number are required", "error");
      return;
    }

    setLoading(true);
    try {
      let nextFollowupAt = null;
      if (scheduleFollowup && followupDate) {
        nextFollowupAt = new Date(`${followupDate}T${followupTime || "10:00"}:00`).toISOString();
      }

      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        alternatePhone: alternatePhone.trim() || null,
        source,
        status,
        field1Label: businessSettings?.field1Label || null,
        field1Value: field1Value.trim() || null,
        field2Label: businessSettings?.field2Label || null,
        field2Value: field2Value.trim() || null,
        field3Label: businessSettings?.field3Label || null,
        field3Value: field3Value.trim() || null,
        field4Label: businessSettings?.field4Label || null,
        field4Value: field4Value.trim() || null,
        notes: notes.trim() || null,
        nextFollowupAt,
      };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(ignoreDuplicate ? { "x-ignore-duplicate": "true" } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409) {
        setDuplicateWarning(data.duplicateLead);
        showToast("Lead with this phone already exists", "error");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to create lead");
      }

      showToast("Lead created successfully!", "success");
      router.push(`/leads/${data.lead.id}`);
      router.refresh();
    } catch (err: any) {
      showToast(err.message || "Failed to create lead", "error");
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: "NEW", label: "New Lead" },
    { value: "CONTACTED", label: "Contacted" },
    { value: "INTERESTED", label: "Interested" },
    { value: "FOLLOW_UP", label: "Follow Up" },
    { value: "SITE_VISIT", label: "Site Visit / Meeting" },
    { value: "CONVERTED", label: "Converted" },
    { value: "LOST", label: "Lost" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/leads"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Lead</h1>
            <p className="text-xs text-slate-500 mt-0.5">Add prospect details or import spreadsheet</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsImportModalOpen(true)}
        >
          <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-600" /> Import Excel / CSV
        </Button>
      </div>

      {duplicateWarning && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-bold text-sm">Existing Lead Found</p>
            <p>
              A lead with phone <strong>{duplicateWarning.phone}</strong> already exists:{" "}
              <strong>{duplicateWarning.name}</strong> (Status: {duplicateWarning.status}).
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Link
                href={`/leads/${duplicateWarning.id}`}
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
              >
                View Existing Lead <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="text-slate-700 underline font-medium"
              >
                Create anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {/* Primary Contact Info */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="e.g. Vikram Malhotra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Primary Phone Number"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={(e) => checkDuplicate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="vikram@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Alternate Phone / WhatsApp"
                placeholder="e.g. 9123456789"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
              />
            </div>
          </div>

          {/* Lead Meta */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Lead Status & Source</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Initial Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={statusOptions}
              />
              <Select
                label="Lead Source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                options={COMMON_LEAD_SOURCES.map((s) => ({ value: s, label: s }))}
              />
            </div>
          </div>

          {/* Niche Requirements (generic 4 fields) */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Requirement Details</h2>
              <span className="text-xs text-indigo-600 font-medium capitalize">
                {businessSettings?.businessType?.replace(/_/g, " ").toLowerCase() || "Business"} Fields
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {businessSettings?.field1Label && (
                <Input
                  label={businessSettings.field1Label}
                  placeholder={`Enter ${businessSettings.field1Label.toLowerCase()}`}
                  value={field1Value}
                  onChange={(e) => setField1Value(e.target.value)}
                />
              )}
              {businessSettings?.field2Label && (
                <Input
                  label={businessSettings.field2Label}
                  placeholder={`Enter ${businessSettings.field2Label.toLowerCase()}`}
                  value={field2Value}
                  onChange={(e) => setField2Value(e.target.value)}
                />
              )}
              {businessSettings?.field3Label && (
                <Input
                  label={businessSettings.field3Label}
                  placeholder={`Enter ${businessSettings.field3Label.toLowerCase()}`}
                  value={field3Value}
                  onChange={(e) => setField3Value(e.target.value)}
                />
              )}
              {businessSettings?.field4Label && (
                <Input
                  label={businessSettings.field4Label}
                  placeholder={`Enter ${businessSettings.field4Label.toLowerCase()}`}
                  value={field4Value}
                  onChange={(e) => setField4Value(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Initial Follow-up Scheduling */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-950 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleFollowup}
                  onChange={(e) => setScheduleFollowup(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                Schedule First Follow-Up
              </label>
              <span className="text-[11px] text-indigo-600 font-semibold">Never miss a follow-up</span>
            </div>

            {scheduleFollowup && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Input
                  type="date"
                  label="Follow-Up Date"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  required={scheduleFollowup}
                />
                <Input
                  type="time"
                  label="Follow-Up Time"
                  value={followupTime}
                  onChange={(e) => setFollowupTime(e.target.value)}
                  required={scheduleFollowup}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Initial Notes</label>
            <textarea
              rows={3}
              placeholder="Requirement specifics, customer preferences, budget flexibility..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link href="/leads">
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={loading} size="lg">
              <Save className="h-4 w-4 mr-1.5" /> Save Lead & Follow-Up
            </Button>
          </div>
        </form>
      </Card>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          router.push("/leads");
          router.refresh();
        }}
      />
    </div>
  );
}
