"use client";

import React, { useState } from "react";
import { FollowUpItem, FollowUpBucket } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CompleteFollowUpModal } from "./CompleteFollowUpModal";
import { getWhatsAppLink, getCallLink, formatIndianPhone, formatDateTime } from "@/lib/utils";
import {
  CalendarClock,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  CheckCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface FollowUpBucketsProps {
  bucket: FollowUpBucket;
  onBucketChange: (b: FollowUpBucket) => void;
  followUps: FollowUpItem[];
  counts: {
    overdue: number;
    today: number;
    tomorrow: number;
    upcoming: number;
    completed: number;
    totalPending: number;
  };
  onRefresh: () => void;
}

export const FollowUpBuckets: React.FC<FollowUpBucketsProps> = ({
  bucket,
  onBucketChange,
  followUps,
  counts,
  onRefresh,
}) => {
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tabs: { id: FollowUpBucket; label: string; count: number; badgeColor: string }[] = [
    {
      id: "overdue",
      label: "Overdue",
      count: counts.overdue,
      badgeColor: counts.overdue > 0 ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-600",
    },
    {
      id: "today",
      label: "Today",
      count: counts.today,
      badgeColor: counts.today > 0 ? "bg-indigo-100 text-indigo-800 font-bold" : "bg-slate-100 text-slate-600",
    },
    {
      id: "tomorrow",
      label: "Tomorrow",
      count: counts.tomorrow,
      badgeColor: "bg-slate-100 text-slate-600",
    },
    {
      id: "upcoming",
      label: "Upcoming",
      count: counts.upcoming,
      badgeColor: "bg-slate-100 text-slate-600",
    },
    {
      id: "completed",
      label: "Completed",
      count: counts.completed,
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Bucket Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((tab) => {
          const isActive = bucket === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onBucketChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : tab.badgeColor
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Follow-up List */}
      {followUps.length === 0 ? (
        <EmptyState
          icon={bucket === "today" ? <Sparkles className="h-6 w-6 text-indigo-600" /> : <CalendarClock className="h-6 w-6 text-indigo-600" />}
          title={`No ${bucket} follow-ups`}
          description={
            bucket === "today"
              ? "Awesome! You have cleared all follow-ups scheduled for today."
              : `There are currently no follow-ups in the ${bucket} bucket.`
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {followUps.map((item) => {
            const isCompleted = item.status === "DONE";
            const lead = item.lead;
            const whatsappUrl = lead
              ? getWhatsAppLink(lead.phone, `Hello ${lead.name}, following up regarding your enquiry...`)
              : "#";
            const callUrl = lead ? getCallLink(lead.phone) : "#";

            return (
              <div
                key={item.id}
                className={`rounded-xl border bg-white p-4 shadow-xs transition-all flex flex-col justify-between ${
                  bucket === "overdue"
                    ? "border-rose-200 ring-1 ring-rose-500/10"
                    : bucket === "today"
                    ? "border-indigo-200 ring-1 ring-indigo-500/10"
                    : "border-slate-200"
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      {lead ? (
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-bold text-slate-900 text-base hover:text-indigo-600 hover:underline"
                        >
                          {lead.name}
                        </Link>
                      ) : (
                        <span className="font-bold text-slate-900 text-base">Unknown Lead</span>
                      )}
                      {lead && (
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {formatIndianPhone(lead.phone)}
                        </p>
                      )}
                    </div>

                    {lead && <Badge status={lead.status} size="sm" />}
                  </div>

                  {/* Scheduled Time Banner */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <Clock className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <span>Scheduled: {formatDateTime(item.scheduledAt)}</span>
                  </div>

                  {/* Note / Context */}
                  {item.note && (
                    <p className="text-xs text-slate-700 bg-amber-50/70 border border-amber-100 p-2.5 rounded-lg italic">
                      "{item.note}"
                    </p>
                  )}
                </div>

                {/* Actions bottom bar */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {lead && (
                      <>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 h-8 px-2.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all text-xs font-semibold"
                          title="WhatsApp"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={callUrl}
                          className="flex items-center gap-1 h-8 px-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-xs font-semibold"
                          title="Call"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>Call</span>
                        </a>
                      </>
                    )}
                  </div>

                  {!isCompleted ? (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => {
                        setSelectedFollowUp(item);
                        setIsModalOpen(true);
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Done
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <CheckCheck className="h-4 w-4" /> Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complete Follow-up Modal */}
      <CompleteFollowUpModal
        followUp={selectedFollowUp}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFollowUp(null);
        }}
        onCompleted={onRefresh}
      />
    </div>
  );
};
