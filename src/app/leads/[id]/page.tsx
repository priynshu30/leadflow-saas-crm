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
import { WorkProofModal } from "@/components/attendance/WorkProofModal";
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
  UserCheck,
  CheckCircle2,
  Music,
  Camera,
  Play,
  Pause,
  MapPin,
  ExternalLink,
  PlusCircle,
} from "lucide-react";

interface TeamEmployee {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AttachedWorkProof {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  createdAt: string;
  user: { id: number; name: string; avatarUrl: string | null };
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const leadId = params.id as string;

  const [lead, setLead] = useState<LeadWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingAssignee, setUpdatingAssignee] = useState(false);
  const [teamList, setTeamList] = useState<TeamEmployee[]>([]);
  const [leadProofs, setLeadProofs] = useState<AttachedWorkProof[]>([]);
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const [audioPlayers, setAudioPlayers] = useState<Record<number, HTMLAudioElement>>({});

  // Modals state
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpItem | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isWorkProofModalOpen, setIsWorkProofModalOpen] = useState(false);
  const [quickOutcomeVisible, setQuickOutcomeVisible] = useState<"CALL" | "WHATSAPP" | null>(null);

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      const [leadRes, proofsRes, teamRes] = await Promise.all([
        fetch(`/api/leads/${leadId}`),
        fetch(`/api/work-proof?leadId=${leadId}`),
        fetch(`/api/employees`),
      ]);

      if (leadRes.ok) {
        const data = await leadRes.json();
        setLead(data.lead);
      } else {
        showToast("Lead not found", "error");
        router.push("/leads");
      }

      if (proofsRes.ok) {
        const pData = await proofsRes.json();
        setLeadProofs(pData.workProofs || []);
      }

      if (teamRes.ok) {
        const tData = await teamRes.json();
        setTeamList(tData.employees || []);
      }
    } catch {
      showToast("Failed to fetch lead details", "error");
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
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssigneeChange = async (newUserId: string) => {
    if (!lead) return;
    setUpdatingAssignee(true);
    try {
      const parsedId = newUserId ? parseInt(newUserId, 10) : null;
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedUserId: parsedId }),
      });

      if (res.ok) {
        const assignedName = teamList.find((t) => t.id === parsedId)?.name || "Unassigned";
        showToast(`Lead assigned to ${assignedName}`, "success");
        fetchLead();
      } else {
        showToast("Failed to update assignee", "error");
      }
    } catch {
      showToast("Failed to assign lead", "error");
    } finally {
      setUpdatingAssignee(false);
    }
  };

  const handleQuickOutcome = async (outcomeNote: string, activityType: "CALL" | "WHATSAPP") => {
    try {
      await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead?.id,
          type: activityType,
          description: outcomeNote,
        }),
      });
      showToast("Outcome recorded in timeline!", "success");
      setQuickOutcomeVisible(null);
      fetchLead();
    } catch {
      showToast("Failed to log activity", "error");
    }
  };

  const toggleAudio = (id: number, url: string) => {
    if (!audioPlayers[id]) {
      const audio = new Audio(url);
      audio.onended = () => setPlayingAudio(null);
      setAudioPlayers((prev) => ({ ...prev, [id]: audio }));
      audio.play().catch(() => showToast("Could not play audio", "error"));
      setPlayingAudio(id);
    } else if (playingAudio === id) {
      audioPlayers[id].pause();
      setPlayingAudio(null);
    } else {
      audioPlayers[id].play().catch(() => showToast("Could not play audio", "error"));
      setPlayingAudio(id);
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
    } catch {
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

  const whatsappUrl = getWhatsAppLink(lead.phone, `Hello ${lead.name}, regarding your enquiry...`);
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
          <Button
            size="sm"
            onClick={() => setIsWorkProofModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Camera className="h-3.5 w-3.5 mr-1.5" /> Attach Photo / Recording
          </Button>
          <Link href={`/leads/${lead.id}/edit`}>
            <Button size="sm" variant="outline">
              <Edit className="h-3.5 w-3.5 mr-1" /> Edit
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

          {/* Quick Actions & Status Dropdown */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setQuickOutcomeVisible("WHATSAPP")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-semibold text-xs shadow-xs"
            >
              <MessageSquare className="h-4 w-4" /> WhatsApp
            </a>
            <a
              href={callUrl}
              onClick={() => setQuickOutcomeVisible("CALL")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all font-semibold text-xs shadow-xs"
            >
              <Phone className="h-4 w-4" /> Call Lead
            </a>
            <button
              type="button"
              onClick={() => setIsEmailModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-semibold text-xs shadow-xs"
            >
              <Mail className="h-4 w-4" /> Email
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

        {/* Quick Post-Call / WhatsApp Outcome Bar */}
        {quickOutcomeVisible && (
          <div className="my-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
            <div className="text-xs text-amber-900 font-semibold flex items-center gap-1.5">
              <span>Did the client connect via {quickOutcomeVisible === "CALL" ? "Phone Call" : "WhatsApp"}?</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickOutcome("Connected: Client is interested in offer", quickOutcomeVisible)}
                className="text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg shadow-2xs"
              >
                ✅ Connected / Interested
              </button>
              <button
                type="button"
                onClick={() => handleQuickOutcome("Busy: Client asked to call back later", quickOutcomeVisible)}
                className="text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg shadow-2xs"
              >
                ⏳ Busy / Call Back
              </button>
              <button
                type="button"
                onClick={() => handleQuickOutcome("Ringing / Not Picked Up", quickOutcomeVisible)}
                className="text-[11px] font-semibold bg-slate-600 hover:bg-slate-700 text-white px-2.5 py-1 rounded-lg shadow-2xs"
              >
                ❌ Not Picked
              </button>
              <button
                type="button"
                onClick={() => setQuickOutcomeVisible(null)}
                className="text-[11px] text-slate-500 hover:text-slate-800 px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Assignee & Custom Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-4">
          {/* Assignee Selector Box */}
          <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="h-3 w-3" /> Assigned Agent
            </span>
            {teamList.length > 0 ? (
              <select
                value={lead.assignedUserId || ""}
                disabled={updatingAssignee}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="mt-1 w-full bg-white border border-indigo-200 text-xs rounded-lg px-2 py-1 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Unassigned (Company Pool)</option>
                {teamList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.role === "ADMIN" ? "(Admin)" : "(Agent)"}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs font-semibold text-slate-800 mt-1">
                {lead.assignedUser?.name || "Unassigned"}
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              {lead.field1Label || "Field 1"}
            </span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{lead.field1Value || "—"}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              {lead.field2Label || "Field 2"}
            </span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{lead.field2Value || "—"}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              {lead.field3Label || "Field 3"}
            </span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{lead.field3Value || "—"}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              {lead.field4Label || "Field 4"}
            </span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{lead.field4Value || "—"}</p>
          </div>
        </div>

        {lead.notes && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs text-slate-700">
            <span className="font-semibold text-slate-900 block mb-1">Notes:</span>
            <p className="whitespace-pre-wrap">{lead.notes}</p>
          </div>
        )}
      </Card>

      {/* Attached Work Proofs & Recordings (if any) */}
      {leadProofs.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="flex items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Music className="h-4 w-4 text-emerald-600" /> Attached Field Proofs & Call Recordings ({leadProofs.length})
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Media and audio files tagged to this client</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsWorkProofModalOpen(true)}
              className="text-xs"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add Proof
            </Button>
          </CardHeader>

          <div className="space-y-3 pt-2">
            {leadProofs.map((prf) => (
              <div key={prf.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{prf.title}</h4>
                    {prf.description && (
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{prf.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {formatDate(prf.createdAt)} by {prf.user?.name}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {prf.imageUrl && (
                    <img
                      src={prf.imageUrl}
                      alt="proof"
                      className="h-16 w-24 rounded-lg object-cover border border-slate-200 cursor-pointer"
                      onClick={() => window.open(prf.imageUrl!, "_blank")}
                    />
                  )}
                  {prf.audioUrl && (
                    <button
                      type="button"
                      onClick={() => toggleAudio(prf.id, prf.audioUrl!)}
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-3 py-1.5 rounded-lg font-bold transition-colors"
                    >
                      {playingAudio === prf.id ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {playingAudio === prf.id ? "Pause Call Recording" : "Play Call Recording"}
                    </button>
                  )}
                  {prf.locationName && (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {prf.locationName}
                      {prf.latitude && prf.longitude && (
                        <a
                          href={`https://maps.google.com/?q=${prf.latitude},${prf.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 font-semibold hover:underline ml-1"
                        >
                          Map
                        </a>
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

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
              <div className="text-xs text-slate-500 py-3 italic">No active follow-up scheduled.</div>
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
                              setSelectedFollowUp({
                                ...fu,
                                lead: { id: lead.id, name: lead.name, phone: lead.phone, status: lead.status },
                              });
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
                  Log phone calls, WhatsApp messages, meeting notes and status updates
                </p>
              </div>
            </CardHeader>

            <ActivityTimeline leadId={lead.id} activities={lead.activities || []} onActivityAdded={fetchLead} />
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

      {/* Work Proof Modal Tagged to this Lead */}
      <WorkProofModal
        isOpen={isWorkProofModalOpen}
        onClose={() => setIsWorkProofModalOpen(false)}
        onSubmitted={fetchLead}
        defaultLeadId={lead.id}
        defaultLeadName={lead.name}
      />
    </div>
  );
}
