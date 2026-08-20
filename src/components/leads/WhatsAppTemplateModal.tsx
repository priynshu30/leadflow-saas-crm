"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { LeadWithRelations } from "@/types";
import { getWhatsAppLink } from "@/lib/utils";
import { MessageSquare, Send, Sparkles, Copy, Check } from "lucide-react";

interface WhatsAppTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: LeadWithRelations | null;
  businessName?: string;
}

export const WhatsAppTemplateModal: React.FC<WhatsAppTemplateModalProps> = ({
  isOpen,
  onClose,
  lead,
  businessName = "LeadFlow",
}) => {
  if (!lead) return null;

  const templates = [
    {
      id: "intro",
      name: "👋 Introduction & Greeting",
      text: `Hello ${lead.name},\n\nThank you for reaching out to *${businessName}*! We received your requirement for *${lead.field1Value || "our services"}*.\n\nWhen would be a convenient time for a quick 2-minute call?`,
    },
    {
      id: "brochure",
      name: "📄 Brochure & Details Share",
      text: `Hi ${lead.name},\n\nAs discussed, sharing the complete catalog & price details for *${lead.field1Value || "your inquiry"}*.\n\nPlease let us know if you have any questions or would like to schedule a site visit / live demo.\n\nBest regards,\n*${businessName}*`,
    },
    {
      id: "followup",
      name: "⏰ Friendly Follow-up",
      text: `Hi ${lead.name},\n\nJust checking in regarding your requirement at *${businessName}*.\n\nAre you still looking to move forward? We have special offers valid for this week that match your budget of *${lead.field4Value || "your range"}*!`,
    },
    {
      id: "meeting",
      name: "📅 Schedule Meeting / Site Visit",
      text: `Hello ${lead.name},\n\nWe would love to arrange a personalized walkthrough / meeting for *${lead.field1Value || "your requirement"}*.\n\nWould *Tomorrow at 11:00 AM* or *4:00 PM* work better for you?`,
    },
  ];

  const [selectedTemplateId, setSelectedTemplateId] = useState("intro");
  const [customMessage, setCustomMessage] = useState(templates[0].text);
  const [copied, setCopied] = useState(false);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tmpl = templates.find((t) => t.id === id);
    if (tmpl) setCustomMessage(tmpl.text);
  };

  const handleSendWhatsApp = () => {
    const url = getWhatsAppLink(lead.phone, customMessage);
    window.open(url, "_blank");
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="WhatsApp Quick Message" size="lg">
      <div className="space-y-5">
        {/* Lead Target Info */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              WA
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                To: {lead.name} ({lead.phone})
              </p>
              <p className="text-[11px] text-emerald-800">
                {lead.field1Value ? `Requirement: ${lead.field1Value}` : "Direct WhatsApp Chat"}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-md">
            1-Click Send
          </span>
        </div>

        {/* Template Selector Pills */}
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Choose Message Template
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {templates.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tmpl.id)}
                className={`p-2.5 rounded-xl text-left text-xs font-medium border transition-all ${
                  selectedTemplateId === tmpl.id
                    ? "bg-indigo-50/80 border-indigo-600 text-indigo-900 shadow-2xs font-semibold"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {tmpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Message Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700">Message Preview & Edit</label>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy text"}
            </button>
          </div>
          <textarea
            rows={5}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full p-3 text-xs font-sans rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden leading-relaxed resize-none bg-slate-50/50"
            placeholder="Type your WhatsApp message..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <button
            onClick={handleSendWhatsApp}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Open in WhatsApp</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
