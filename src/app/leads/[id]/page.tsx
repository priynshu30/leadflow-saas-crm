"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { ActivityTimeline } from "@/components/leads/ActivityTimeline";
import { CompleteFollowUpModal } from "@/components/followups/CompleteFollowUpModal";
import { SendEmailModal } from "@/components/leads/SendEmailModal";
import { LeadWithRelations, LeadStatus, FollowUpItem } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { getWhatsAppLink, getCallLink, formatIndianPhone, formatDateTime, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Mail,
  Edit,
  Trash2,
  CalendarClock,
  Clock,
  Plus,
  UserCheck,
  CheckCircle2,
} from "lucide-react";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const leadId = params.id as string;

  const [lead, setLead] = useState<LeadWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  // Status updating state
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Modal for completing follow up
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpItem | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leads/${leadId}`);
      if (res.ok) {
        const data = await res.json();
        setLead(data.lead);
      } else {
        showToast("Lead not found", "error");
        router.push("/leads");
      }
    } catch (e) {
      showToast("Failed to fetch lead", "error");
    } finally {
      setLoading(false);
    }
  }, [leadId, router, showToast]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead || newStatus === lead.status) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast(`Status updated to ${newStatus}`, "success");
        fetchLead();
      }
    } catch (e) {
      showToast("Failed to update status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this lead? All activities and follow-ups will also be removed.")) {
      return;
    }
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Lead deleted successfully", "success");
        router.push("/leads");
      }
    } catch (e) {
      showToast("Failed to delete lead", "error");
    }
  };

  if (loading || !lead) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 rounded-lg" />
        <div className="h-40 bg-slate-200 rounded-xl" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const whatsappUrl = getWhatsAppLink(lead.phone, `Hello ${lead.name}, regarding your enquiry at LeadFlow...`);
  const callUrl = getCallLink(lead.phone);

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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Leads
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/leads/${lead.id}/edit`}>
            <Button size="sm" variant="outline">
              <Edit className="h-3.5 w-3.5 mr-1" /> Edit Lead
            </Button>
          </Link>
          <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <Card className="border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{lead.name}</h1>
              <Badge status={lead.status} />
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
              <span className="font-mono">{formatIndianPhone(lead.phone)}</span>
              {lead.email && <span>• {lead.email}</span>}
              <span>• Source: {lead.source || "Direct Call"}</span>
              <span>• Created {formatDate(lead.createdAt)}</span>
            </div>
          </div>

          {/* Quick Communication & Status Dropdown */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-semibold text-xs shadow-xs"
            >
              <MessageSquare className="h-4 w-4" /> WhatsApp
            </a>
            <a
              href={callUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all font-semibold text-xs shadow-xs"
            >
              <Phone className="h-4 w-4" /> Call Lead
            </a>
            <button
              type="button"
              onClick={() => setIsEmailModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-semibold text-xs shadow-xs"
            >
              <Mail className="h-4 w-4" /> Email Lead
            </button>

            <div className="w-40">
              <Select
                value={lead.status}
                disabled={updatingStatus}
                onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                options={statusOptions}
              />
            </div>
          </div>
        </div>

        {/* Niche Requirements Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              {lead.field1Label || "Field 1"}
            </span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
              {lead.field1Value || "—"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              {lead.field2Label || "Field 2"}
            </span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
              {lead.field2Value || "—"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              {lead.field3Label || "Field 3"}
            </span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
              {lead.field3Value || "—"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              {lead.field4Label || "Field 4"}
            </span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
              {lead.field4Value || "—"}
            </p>
          </div>
        </div>

        {lead.notes && (
          <div className="mt-4 p-3.5 rounded-lg bg-slate-50/70 border border-slate-100 text-xs text-slate-700">
            <span className="font-semibold text-slate-900 block mb-1">Notes:</span>
            <p className="whitespace-pre-wrap">{lead.notes}</p>
          </div>
        )}
      </Card>

      {/* Grid: Next Follow-Up on left, Activity Timeline on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scheduled Follow-ups */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between pb-3">
              <CardTitle className="text-sm">Next Follow-Up</CardTitle>
              <CalendarClock className="h-4 w-4 text-indigo-600" />
            </CardHeader>

            {lead.nextFollowupAt ? (
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <span>{formatDateTime(lead.nextFollowupAt)}</span>
                </div>
                <p className="text-[11px] text-indigo-700">Scheduled in pipeline</p>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-3 italic">
                No active follow-up scheduled.
              </div>
            )}

            {/* Follow-up list history */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Follow-Up History
              </span>
              {lead.followUps && lead.followUps.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {lead.followUps.map((fu) => (
                    <div key={fu.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{formatDateTime(fu.scheduledAt)}</p>
                        {fu.note && <p className="text-[11px] text-slate-500 italic truncate max-w-[180px]">{fu.note}</p>}
                      </div>
                      <div>
                        {fu.status === "PENDING" ? (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => {
                              setSelectedFollowUp({ ...fu, lead: { id: lead.id, name: lead.name, phone: lead.phone, status: lead.status } });
                              setIsFollowUpModalOpen(true);
                            }}
                          >
                            Done
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Done
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No follow-ups logged.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Full Activity Log & Timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Activity & Engagement Timeline</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Log phone calls, WhatsApp messages, and status updates
                </p>
              </div>
            </CardHeader>

            <ActivityTimeline
              leadId={lead.id}
              activities={lead.activities || []}
              onActivityAdded={fetchLead}
            />
          </Card>
        </div>
      </div>

      {/* Complete Follow-up Modal */}
      <CompleteFollowUpModal
        followUp={selectedFollowUp}
        isOpen={isFollowUpModalOpen}
        onClose={() => {
          setIsFollowUpModalOpen(false);
          setSelectedFollowUp(null);
        }}
        onCompleted={fetchLead}
      />

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        lead={lead}
        onEmailLogged={fetchLead}
      />
    </div>
  );
}
