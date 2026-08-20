"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LeadWithRelations } from "@/types";
import { formatIndianPhone, formatDate, getCallLink } from "@/lib/utils";
import { computeLeadScore } from "@/lib/leadScoring";
import { Phone, MessageSquare, Clock, ArrowUpRight, Flame, Zap, Snowflake } from "lucide-react";

interface LeadTableProps {
  leads: LeadWithRelations[];
  onStatusChange?: (leadId: number, newStatus: any) => void;
  onOpenWhatsAppModal?: (lead: LeadWithRelations) => void;
}

export const LeadTable: React.FC<LeadTableProps> = ({ leads, onOpenWhatsAppModal }) => {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                Lead Name & Contact
              </th>
              <th scope="col" className="px-5 py-3.5">
                AI Score & Status
              </th>
              <th scope="col" className="px-5 py-3.5">
                Requirement Details
              </th>
              <th scope="col" className="px-5 py-3.5">
                Next Follow-Up
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Quick Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {leads.map((lead) => {
              const aiScore = computeLeadScore(lead);
              const callUrl = getCallLink(lead.phone);

              return (
                <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors group">
                  {/* Name & Contact */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600 flex items-center gap-1 group-hover:underline"
                      >
                        <span>{lead.name}</span>
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
                      </Link>
                      <span className="text-xs text-slate-500 font-mono mt-0.5">
                        {formatIndianPhone(lead.phone)}
                      </span>
                      {lead.source && (
                        <span className="inline-block mt-1 text-[11px] text-slate-400">
                          Source: {lead.source}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status & AI Score */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      <Badge status={lead.status} />
                      <span
                        title={`AI Probability: ${aiScore.score}% (${aiScore.reasons.join(", ")})`}
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          aiScore.category === "HOT"
                            ? "bg-rose-100 text-rose-700"
                            : aiScore.category === "WARM"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {aiScore.category === "HOT" && <Flame className="h-2.5 w-2.5 text-rose-600" />}
                        {aiScore.category === "WARM" && <Zap className="h-2.5 w-2.5 text-amber-600" />}
                        {aiScore.category === "COLD" && <Snowflake className="h-2.5 w-2.5 text-slate-500" />}
                        <span>{aiScore.label} ({aiScore.score}%)</span>
                      </span>
                    </div>
                  </td>

                  {/* Niche Requirement details */}
                  <td className="px-5 py-4">
                    <div className="text-xs space-y-0.5 max-w-xs">
                      {lead.field1Value && (
                        <p className="truncate text-slate-800">
                          <span className="text-slate-400 font-medium">{lead.field1Label || "Field 1"}:</span>{" "}
                          {lead.field1Value}
                        </p>
                      )}
                      {lead.field2Value && (
                        <p className="truncate text-slate-800">
                          <span className="text-slate-400 font-medium">{lead.field2Label || "Field 2"}:</span>{" "}
                          {lead.field2Value}
                        </p>
                      )}
                      {!lead.field1Value && !lead.field2Value && (
                        <span className="text-slate-400 italic">No requirement set</span>
                      )}
                    </div>
                  </td>

                  {/* Next Followup */}
                  <td className="px-5 py-4">
                    {lead.nextFollowupAt ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span>{formatDate(lead.nextFollowupAt)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">None scheduled</span>
                    )}
                  </td>

                  {/* Action buttons (WhatsApp + Call + Details) */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenWhatsAppModal?.(lead)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs"
                        title="Send WhatsApp Template"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <a
                        href={callUrl}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-2xs"
                        title="Call Lead"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                      <Link href={`/leads/${lead.id}`}>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

