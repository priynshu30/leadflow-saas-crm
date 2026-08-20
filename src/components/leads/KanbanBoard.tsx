"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LeadWithRelations, LeadStatus } from "@/types";
import { computeLeadScore } from "@/lib/leadScoring";
import { getWhatsAppLink, getCallLink } from "@/lib/utils";
import {
  Phone,
  MessageSquare,
  Clock,
  ArrowUpRight,
  MoreVertical,
  Flame,
  Zap,
  Snowflake,
  Plus,
} from "lucide-react";

interface KanbanBoardProps {
  leads: LeadWithRelations[];
  onStatusChange: (leadId: number, newStatus: LeadStatus) => Promise<void> | void;
  onOpenWhatsAppModal: (lead: LeadWithRelations) => void;
}

interface ColumnConfig {
  status: LeadStatus;
  title: string;
  color: string;
  badgeBg: string;
  badgeText: string;
}

const COLUMNS: ColumnConfig[] = [
  { status: "NEW", title: "New Inquiries", color: "border-t-blue-500", badgeBg: "bg-blue-50", badgeText: "text-blue-700" },
  { status: "CONTACTED", title: "Contacted", color: "border-t-sky-500", badgeBg: "bg-sky-50", badgeText: "text-sky-700" },
  { status: "INTERESTED", title: "Interested", color: "border-t-indigo-500", badgeBg: "bg-indigo-50", badgeText: "text-indigo-700" },
  { status: "FOLLOW_UP", title: "Follow-up", color: "border-t-amber-500", badgeBg: "bg-amber-50", badgeText: "text-amber-700" },
  { status: "SITE_VISIT", title: "Site Visit / Demo", color: "border-t-purple-500", badgeBg: "bg-purple-50", badgeText: "text-purple-700" },
  { status: "CONVERTED", title: "Converted Deals 🎉", color: "border-t-emerald-500", badgeBg: "bg-emerald-50", badgeText: "text-emerald-700" },
  { status: "LOST", title: "Lost / Closed", color: "border-t-slate-400", badgeBg: "bg-slate-100", badgeText: "text-slate-700" },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  onStatusChange,
  onOpenWhatsAppModal,
}) => {
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<LeadStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    e.dataTransfer.setData("text/plain", leadId.toString());
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, colStatus: LeadStatus) => {
    e.preventDefault();
    if (dragOverCol !== colStatus) {
      setDragOverCol(colStatus);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const leadIdStr = e.dataTransfer.getData("text/plain");
    const leadId = parseInt(leadIdStr, 10);
    if (!isNaN(leadId)) {
      const currentLead = leads.find((l) => l.id === leadId);
      if (currentLead && currentLead.status !== targetStatus) {
        onStatusChange(leadId, targetStatus);
      }
    }
    setDraggedLeadId(null);
  };

  return (
    <div className="w-full overflow-x-auto pb-4 pt-1 scrollbar-thin">
      <div className="flex gap-4 min-w-[1300px] items-start">
        {COLUMNS.map((col) => {
          const colLeads = leads.filter((l) => l.status === col.status);
          const isOver = dragOverCol === col.status;

          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`flex-1 min-w-[240px] max-w-[280px] bg-slate-50/90 rounded-2xl p-3 border-t-4 border border-slate-200 shadow-2xs transition-colors ${
                col.color
              } ${isOver ? "bg-indigo-50/60 ring-2 ring-indigo-400" : ""}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">{col.title}</h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badgeBg} ${col.badgeText}`}>
                    {colLeads.length}
                  </span>
                </div>
              </div>

              {/* Column Cards Container */}
              <div className="space-y-2.5 min-h-[300px]">
                {colLeads.length === 0 ? (
                  <div className="h-28 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-400">
                    Drop leads here
                  </div>
                ) : (
                  colLeads.map((lead) => {
                    const aiScore = computeLeadScore(lead);
                    const isDragging = draggedLeadId === lead.id;

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className={`bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group ${
                          isDragging ? "opacity-40 scale-95" : ""
                        }`}
                      >
                        {/* Header: Name & AI Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="font-bold text-xs text-slate-900 hover:text-indigo-600 truncate flex-1"
                          >
                            {lead.name}
                          </Link>

                          {/* AI Score Badge */}
                          <span
                            title={`AI Score: ${aiScore.score}/100 - ${aiScore.reasons.join(", ")}`}
                            className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
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
                            <span>{aiScore.score}%</span>
                          </span>
                        </div>

                        {/* Phone / Contact */}
                        <p className="text-[11px] text-slate-500 font-mono mt-1">{lead.phone}</p>

                        {/* Requirement snippet */}
                        {lead.field1Value && (
                          <div className="mt-2 text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-slate-700 truncate">
                            <span className="font-semibold text-slate-900">{lead.field1Value}</span>
                            {lead.field4Value && (
                              <span className="text-indigo-600 font-semibold ml-1.5">• {lead.field4Value}</span>
                            )}
                          </div>
                        )}

                        {/* Footer: Quick Actions */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {/* WhatsApp Template Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenWhatsAppModal(lead);
                              }}
                              className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 border border-emerald-200/60 transition-colors"
                              title="Send WhatsApp Template"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>

                            {/* Direct Call */}
                            <a
                              href={getCallLink(lead.phone)}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded-md text-blue-600 hover:bg-blue-50 border border-blue-200/60 transition-colors"
                              title="Call"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          </div>

                          <Link
                            href={`/leads/${lead.id}`}
                            className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                          >
                            <span>Open</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
