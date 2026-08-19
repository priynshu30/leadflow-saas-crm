"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Select } from "./Select";
import { Button } from "./Button";
import { COMMON_LEAD_SOURCES } from "@/lib/constants";
import { useToast } from "./Toast";
import { AlertCircle, ArrowRight, Calendar, UserCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded?: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onLeadAdded,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [businessSettings, setBusinessSettings] = useState<any>(null);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("Direct Call");
  const [field1Value, setField1Value] = useState("");
  const [field2Value, setField2Value] = useState("");
  const [field3Value, setField3Value] = useState("");
  const [field4Value, setField4Value] = useState("");
  const [notes, setNotes] = useState("");
  const [scheduleFollowup, setScheduleFollowup] = useState(true);
  const [followupDate, setFollowupDate] = useState("");
  const [followupTime, setFollowupTime] = useState("11:00");

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);

  // Fetch business default labels
  useEffect(() => {
    if (isOpen) {
      fetch("/api/settings/business")
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) setBusinessSettings(data.settings);
        })
        .catch(() => {});

      // Default follow up date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFollowupDate(tomorrow.toISOString().split("T")[0]);
    }
  }, [isOpen]);

  // Check duplicate phone on blur
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
    } catch (e) {
      // ignore
    }
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
        source,
        field1Value: field1Value.trim() || null,
        field2Value: field2Value.trim() || null,
        field3Value: field3Value.trim() || null,
        field4Value: field4Value.trim() || null,
        notes: notes.trim() || null,
        nextFollowupAt,
        status: "NEW",
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
        showToast("Lead with this phone number already exists", "error");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to create lead");
      }

      showToast("Lead created successfully!", "success");
      // Reset form
      setName("");
      setPhone("");
      setField1Value("");
      setField2Value("");
      setField3Value("");
      setField4Value("");
      setNotes("");
      setDuplicateWarning(null);
      onClose();

      if (onLeadAdded) {
        onLeadAdded();
      } else {
        router.refresh();
      }
    } catch (error: any) {
      showToast(error.message || "Failed to create lead", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Add Lead"
      description="Quickly capture a new enquiry and schedule immediate follow-up"
      maxWidth="lg"
    >
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
        {duplicateWarning && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold">Existing Lead Found</p>
              <p>
                A lead with phone <strong>{duplicateWarning.phone}</strong> already exists:{" "}
                <strong>{duplicateWarning.name}</strong> (Status: {duplicateWarning.status}).
              </p>
              <div className="flex gap-2 pt-1">
                <Link
                  href={`/leads/${duplicateWarning.id}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
                >
                  View Existing Lead <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="text-slate-600 underline font-medium ml-2"
                >
                  Create anyway
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Full Name"
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Phone Number"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={(e) => checkDuplicate(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Lead Source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            options={COMMON_LEAD_SOURCES.map((s) => ({ value: s, label: s }))}
          />

          {businessSettings?.field1Label && (
            <Input
              label={businessSettings.field1Label}
              placeholder={`e.g. ${businessSettings.field1Label}`}
              value={field1Value}
              onChange={(e) => setField1Value(e.target.value)}
            />
          )}
        </div>

        {/* Niche Requirements Grid */}
        {(businessSettings?.field2Label || businessSettings?.field3Label || businessSettings?.field4Label) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {businessSettings?.field2Label && (
              <Input
                label={businessSettings.field2Label}
                placeholder={`e.g. ${businessSettings.field2Label}`}
                value={field2Value}
                onChange={(e) => setField2Value(e.target.value)}
              />
            )}
            {businessSettings?.field3Label && (
              <Input
                label={businessSettings.field3Label}
                placeholder={`e.g. ${businessSettings.field3Label}`}
                value={field3Value}
                onChange={(e) => setField3Value(e.target.value)}
              />
            )}
            {businessSettings?.field4Label && (
              <Input
                label={businessSettings.field4Label}
                placeholder={`e.g. ${businessSettings.field4Label}`}
                value={field4Value}
                onChange={(e) => setField4Value(e.target.value)}
              />
            )}
          </div>
        )}

        {/* Immediate Follow-up scheduling */}
        <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleFollowup}
                onChange={(e) => setScheduleFollowup(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              Schedule First Follow-Up
            </label>
            <span className="text-[11px] text-indigo-600 font-medium">Never miss a follow-up</span>
          </div>

          {scheduleFollowup && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Input
                type="date"
                label="Date"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
                required={scheduleFollowup}
              />
              <Input
                type="time"
                label="Time"
                value={followupTime}
                onChange={(e) => setFollowupTime(e.target.value)}
                required={scheduleFollowup}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Initial Notes</label>
          <textarea
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            rows={2}
            placeholder="Specific requirements, customer preference, conversation notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save & Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
};
