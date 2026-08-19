"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { LeadWithRelations } from "@/types";
import { getWhatsAppLink, getCallLink, formatIndianPhone, formatDate } from "@/lib/utils";
import { Phone, MessageSquare, Clock, ArrowRight } from "lucide-react";

interface LeadCardProps {
  lead: LeadWithRelations;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead }) => {
  const whatsappUrl = getWhatsAppLink(
    lead.phone,
    `Hello ${lead.name}, regarding your requirement at LeadFlow...`
  );
  const callUrl = getCallLink(lead.phone);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/leads/${lead.id}`}
            className="font-bold text-slate-900 text-base hover:text-indigo-600 flex items-center gap-1"
          >
            {lead.name}
          </Link>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{formatIndianPhone(lead.phone)}</p>
        </div>
        <Badge status={lead.status} size="sm" />
      </div>

      {/* Niche Requirements */}
      {(lead.field1Value || lead.field2Value || lead.field3Value) && (
        <div className="rounded-lg bg-slate-50 p-2.5 text-xs space-y-1">
          {lead.field1Value && (
            <p className="truncate text-slate-800">
              <span className="text-slate-500 font-medium">{lead.field1Label || "Field 1"}:</span>{" "}
              {lead.field1Value}
            </p>
          )}
          {lead.field2Value && (
            <p className="truncate text-slate-800">
              <span className="text-slate-500 font-medium">{lead.field2Label || "Field 2"}:</span>{" "}
              {lead.field2Value}
            </p>
          )}
          {lead.field3Value && (
            <p className="truncate text-slate-800">
              <span className="text-slate-500 font-medium">{lead.field3Label || "Field 3"}:</span>{" "}
              {lead.field3Value}
            </p>
          )}
        </div>
      )}

      {/* Follow-up & Quick actions */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <Clock className="h-3.5 w-3.5 text-indigo-500" />
          <span>{lead.nextFollowupAt ? formatDate(lead.nextFollowupAt) : "No follow-up"}</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center h-8 px-2.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all text-xs font-semibold gap-1"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>WA</span>
          </a>
          <a
            href={callUrl}
            className="flex items-center justify-center h-8 px-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-xs font-semibold gap-1"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>Call</span>
          </a>
          <Link
            href={`/leads/${lead.id}`}
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
