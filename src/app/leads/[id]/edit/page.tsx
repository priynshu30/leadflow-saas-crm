"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { COMMON_LEAD_SOURCES } from "@/lib/constants";
import { ArrowLeft, Save } from "lucide-react";

export default function EditLeadPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const leadId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [source, setSource] = useState("Direct Call");
  const [status, setStatus] = useState("NEW");
  const [field1Label, setField1Label] = useState("");
  const [field1Value, setField1Value] = useState("");
  const [field2Label, setField2Label] = useState("");
  const [field2Value, setField2Value] = useState("");
  const [field3Label, setField3Label] = useState("");
  const [field3Value, setField3Value] = useState("");
  const [field4Label, setField4Label] = useState("");
  const [field4Value, setField4Value] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch(`/api/leads/${leadId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.lead) {
          const l = data.lead;
          setName(l.name || "");
          setPhone(l.phone || "");
          setEmail(l.email || "");
          setAlternatePhone(l.alternatePhone || "");
          setSource(l.source || "Direct Call");
          setStatus(l.status || "NEW");
          setField1Label(l.field1Label || "Field 1");
          setField1Value(l.field1Value || "");
          setField2Label(l.field2Label || "Field 2");
          setField2Value(l.field2Value || "");
          setField3Label(l.field3Label || "Field 3");
          setField3Value(l.field3Value || "");
          setField4Label(l.field4Label || "Field 4");
          setField4Value(l.field4Value || "");
          setNotes(l.notes || "");
        }
      })
      .catch(() => {
        showToast("Failed to load lead", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [leadId, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showToast("Name and phone are required", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          alternatePhone: alternatePhone.trim() || null,
          source,
          status,
          field1Value: field1Value.trim() || null,
          field2Value: field2Value.trim() || null,
          field3Value: field3Value.trim() || null,
          field4Value: field4Value.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update lead");
      }

      showToast("Lead updated successfully!", "success");
      router.push(`/leads/${leadId}`);
      router.refresh();
    } catch (err: any) {
      showToast(err.message || "Failed to update lead", "error");
    } finally {
      setSaving(false);
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

  if (loading) {
    return <div className="h-64 bg-slate-200 animate-pulse rounded-xl" />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/leads/${leadId}`}
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Lead</h1>
          <p className="text-xs text-slate-500 mt-0.5">Update contact info and requirements</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Details */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Primary Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Alternate Phone"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
              />
            </div>
          </div>

          {/* Status & Source */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Status & Source</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={statusOptions}
              />
              <Select
                label="Source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                options={COMMON_LEAD_SOURCES.map((s) => ({ value: s, label: s }))}
              />
            </div>
          </div>

          {/* Niche Requirements */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Requirement Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={field1Label}
                value={field1Value}
                onChange={(e) => setField1Value(e.target.value)}
              />
              <Input
                label={field2Label}
                value={field2Value}
                onChange={(e) => setField2Value(e.target.value)}
              />
              <Input
                label={field3Label}
                value={field3Value}
                onChange={(e) => setField3Value(e.target.value)}
              />
              <Input
                label={field4Label}
                value={field4Value}
                onChange={(e) => setField4Value(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link href={`/leads/${leadId}`}>
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={saving} size="lg">
              <Save className="h-4 w-4 mr-1.5" /> Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
