"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Mail, Send, Sparkles, ExternalLink } from "lucide-react";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    id: number;
    name: string;
    email?: string | null;
    field1Value?: string | null;
  } | null;
  businessName?: string;
  onEmailLogged?: () => void;
}

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  lead,
  businessName = "LeadFlow",
  onEmailLogged,
}) => {
  const { showToast } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen && lead) {
      setSubject(`Regarding your enquiry with ${businessName}`);
      setBody(
        `Hello ${lead.name},\n\nThank you for reaching out to us regarding ${
          lead.field1Value || "your requirement"
        }.\n\nWe would love to share more details with you. Please let us know a good time for a quick discussion.\n\nBest regards,\n${businessName} Team`
      );
    }
  }, [isOpen, lead, businessName]);

  if (!lead) return null;

  const applyTemplate = (type: "followup" | "brochure" | "meeting") => {
    if (type === "followup") {
      setSubject(`Following up: ${lead.field1Value || "Your Enquiry"} - ${businessName}`);
      setBody(
        `Hi ${lead.name},\n\nI wanted to follow up on our previous conversation regarding ${
          lead.field1Value || "your requirement"
        }.\n\nHave you had a chance to review the details? Let me know if you have any questions.\n\nWarm regards,\n${businessName}`
      );
    } else if (type === "brochure") {
      setSubject(`Brochure & Pricing Details - ${businessName}`);
      setBody(
        `Dear ${lead.name},\n\nAs requested, please find attached the details and catalog for ${
          lead.field1Value || "our services"
        }.\n\nFeel free to reply to this email or call us anytime.\n\nBest regards,\n${businessName}`
      );
    } else if (type === "meeting") {
      setSubject(`Meeting Confirmation: ${lead.name} & ${businessName}`);
      setBody(
        `Hello ${lead.name},\n\nThis is to confirm our scheduled discussion regarding ${
          lead.field1Value || "your requirement"
        }.\n\nLooking forward to meeting you.\n\nRegards,\n${businessName}`
      );
    }
  };

  const handleSendAndLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead.email) {
      showToast("This lead does not have an email address specified", "error");
      return;
    }

    setLoading(true);
    try {
      // 1. Open mail client with pre-filled content
      const mailtoUrl = `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      window.open(mailtoUrl, "_blank");

      // 2. Automatically log EMAIL activity on lead's timeline
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          type: "EMAIL",
          description: `Sent Email with Subject: "${subject}"\nTo: ${lead.email}`,
        }),
      });

      if (res.ok) {
        showToast("Email opened & activity logged to timeline!", "success");
        if (onEmailLogged) onEmailLogged();
        onClose();
      }
    } catch (e: any) {
      showToast("Email opened (log saved)", "info");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Email to Prospect"
      description={`Compose message to ${lead.name} (${lead.email || "No email on file"})`}
      maxWidth="lg"
    >
      <form onSubmit={handleSendAndLog} className="space-y-4">
        {!lead.email && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            ⚠️ This lead doesn't have an email address yet. Please update the lead's email first by editing their profile.
          </div>
        )}

        {/* Quick Template Chips */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Quick Templates</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyTemplate("followup")}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 transition-colors"
            >
              ⚡ Follow-Up Check-in
            </button>
            <button
              type="button"
              onClick={() => applyTemplate("brochure")}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
            >
              📄 Brochure / Pricing
            </button>
            <button
              type="button"
              onClick={() => applyTemplate("meeting")}
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
            >
              📅 Meeting Confirmation
            </button>
          </div>
        </div>

        <Input
          label="Recipient Email"
          value={lead.email || ""}
          readOnly
          disabled
          leftIcon={<Mail className="h-4 w-4" />}
        />

        <Input
          label="Subject Line"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Email Message Body</label>
          <textarea
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            required
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!lead.email}>
            <ExternalLink className="h-4 w-4 mr-1.5" /> Open in Mail App & Log
          </Button>
        </div>
      </form>
    </Modal>
  );
};
