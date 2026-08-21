"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Camera,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Phone,
  Briefcase,
  Download,
  Calendar,
  ExternalLink,
  Flame,
  CheckCheck,
  RotateCcw,
  XCircle,
  Timer,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { StartVisitModal } from "@/components/visits/StartVisitModal";
import { CheckOutVisitModal } from "@/components/visits/CheckOutVisitModal";
import { format } from "date-fns";
import * as XLSX from "xlsx";

interface FieldVisitRecord {
  id: number;
  businessId: number;
  userId: number;
  leadId: number | null;
  clientName: string;
  clientPhone: string | null;
  purpose: string;
  checkInTime: string;
  checkInLat: number | null;
  checkInLng: number | null;
  checkInLocation: string | null;
  checkInPhotoUrl: string | null;
  checkOutTime: string | null;
  checkOutLat: number | null;
  checkOutLng: number | null;
  checkOutLocation: string | null;
  checkOutPhotoUrl: string | null;
  durationMinutes: number | null;
  outcome: string | null;
  notes: string | null;
  amountCollected: number | null;
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  lead: {
    id: number;
    name: string;
    phone: string;
    status: string;
  } | null;
}

export default function FieldVisitsPage() {
  const { showToast } = useToast();

  const [visits, setVisits] = useState<FieldVisitRecord[]>([]);
  const [activeVisit, setActiveVisit] = useState<FieldVisitRecord | null>(null);
  const [userRole, setUserRole] = useState<"ADMIN" | "AGENT">("AGENT");
  const [teamEmployees, setTeamEmployees] = useState<{ id: number; name: string; email: string }[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"all" | "today" | "active" | "completed">("all");

  // Modals
  const [showStartModal, setShowStartModal] = useState(false);
  const [checkoutTargetVisit, setCheckoutTargetVisit] = useState<FieldVisitRecord | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Live timer tick
  const [, setTicker] = useState(0);

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/visits?filter=${filterTab}`;
      if (selectedEmployeeId !== "all") {
        url += `&employeeId=${selectedEmployeeId}`;
      }

      const [res, empRes] = await Promise.all([
        fetch(url),
        fetch("/api/employees"),
      ]);

      if (res.ok) {
        const data = await res.json();
        setVisits(data.visits || []);
        setActiveVisit(data.activeVisit || null);
        setUserRole(data.userRole || "AGENT");
      }

      if (empRes.ok) {
        const empData = await empRes.json();
        setTeamEmployees(empData.employees || []);
      }
    } catch {
      showToast("Failed to load field visits", "error");
    } finally {
      setLoading(false);
    }
  }, [filterTab, selectedEmployeeId, showToast]);

  useEffect(() => {
    fetchVisits();
    const interval = setInterval(() => setTicker((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, [fetchVisits]);

  const getActiveVisitDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const mins = Math.max(1, Math.floor(diffMs / 60000));
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 0) return `${hours}h ${remMins}m`;
    return `${mins} mins`;
  };

  const handleExportExcel = () => {
    if (visits.length === 0) {
      showToast("No visits data to export", "error");
      return;
    }

    const rows = visits.map((v) => ({
      "Visit ID": v.id,
      "Agent Name": v.user?.name || "Self",
      "Client / Site Name": v.clientName,
      "Client Phone": v.clientPhone || "—",
      Purpose: v.purpose,
      Status: v.status,
      "Check-In Time": format(new Date(v.checkInTime), "yyyy-MM-dd hh:mm a"),
      "Check-In Location": v.checkInLocation || "—",
      "Check-Out Time": v.checkOutTime ? format(new Date(v.checkOutTime), "yyyy-MM-dd hh:mm a") : "In Progress",
      "Check-Out Location": v.checkOutLocation || "—",
      "Duration (Mins)": v.durationMinutes || "—",
      Outcome: v.outcome || "—",
      "Amount Collected (₹)": v.amountCollected || 0,
      Notes: v.notes || "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Field Visits");
    XLSX.writeFile(workbook, `Field_Visits_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    showToast("Field Visits Excel exported successfully!", "success");
  };

  const totalVisits = visits.length;
  const completedVisits = visits.filter((v) => v.status === "COMPLETED").length;
  const dealsClosed = visits.filter((v) => v.outcome === "DEAL_CLOSED").length;
  const hotLeads = visits.filter((v) => v.outcome === "INTERESTED").length;

  return (
    <>
      {/* Start Visit Modal */}
      {showStartModal && (
        <StartVisitModal
          isOpen={showStartModal}
          onClose={() => setShowStartModal(false)}
          onVisitStarted={fetchVisits}
        />
      )}

      {/* Check Out Visit Modal */}
      {checkoutTargetVisit && (
        <CheckOutVisitModal
          isOpen={!!checkoutTargetVisit}
          visit={checkoutTargetVisit}
          onClose={() => setCheckoutTargetVisit(null)}
          onVisitCompleted={fetchVisits}
        />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-2xl max-h-[90vh] relative">
            <img src={previewImage} alt="preview" className="rounded-2xl max-h-[85vh] w-auto object-contain shadow-2xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/80"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-indigo-600" />
              {userRole === "ADMIN" ? "Team Field Visits & Client Tracking" : "My Field Visits & Client Meetings"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {userRole === "ADMIN"
                ? "👑 Owner View: You can monitor all employees' live visits, GPS locations, site photos & closed deals"
                : "Log and track your on-site client meetings, arrival GPS & site photos"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {userRole === "ADMIN" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportExcel}
                className="border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Export Excel
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setShowStartModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Start Field Visit (Check-In)
            </Button>
          </div>
        </div>

        {/* ACTIVE LIVE VISIT BANNER (If agent is currently on a visit) */}
        {activeVisit && (
          <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white p-5 shadow-lg border border-indigo-700/60 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-red-600" /> LIVE VISIT IN PROGRESS
                  </span>
                  <span className="text-xs text-indigo-200 flex items-center gap-1">
                    <Timer className="h-3.5 w-3.5" />
                    <strong>{getActiveVisitDuration(activeVisit.checkInTime)}</strong> on-site
                  </span>
                </div>

                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Building className="h-5 w-5 text-indigo-300" /> {activeVisit.clientName}
                </h2>

                <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-200 pt-1">
                  <span>
                    <strong>Purpose:</strong> {activeVisit.purpose}
                  </span>
                  <span>·</span>
                  <span>
                    <strong>Checked In:</strong> {format(new Date(activeVisit.checkInTime), "hh:mm a")}
                  </span>
                  {activeVisit.checkInLocation && (
                    <>
                      <span>·</span>
                      <span className="truncate max-w-xs">{activeVisit.checkInLocation}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-2">
                {activeVisit.checkInPhotoUrl && (
                  <img
                    src={activeVisit.checkInPhotoUrl}
                    alt="check-in"
                    className="h-12 w-12 rounded-xl object-cover border border-white/30 cursor-pointer shadow-md"
                    onClick={() => setPreviewImage(activeVisit.checkInPhotoUrl)}
                  />
                )}
                <Button
                  onClick={() => setCheckoutTargetVisit(activeVisit)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 shadow-lg"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5 text-slate-950" /> Complete / Check-Out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500">
              {userRole === "ADMIN" ? "All Team Visits" : "My Visits"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalVisits}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500">Completed Visits</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{completedVisits}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500">Deals Closed</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{dealsClosed}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500">Hot / Interested</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{hotLeads}</p>
          </div>
        </div>

        {/* Filter Bar: Tabs & Employee Dropdown (for Owner) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
          {/* Tabs */}
          <div className="flex gap-1">
            {[
              { id: "all", label: "All Visits" },
              { id: "today", label: "Today's Visits" },
              { id: "active", label: "In Progress" },
              { id: "completed", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  filterTab === tab.id
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Employee Filter Dropdown (Owner Only) */}
          {userRole === "ADMIN" && teamEmployees.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-indigo-600" /> Filter by Employee:
              </span>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="text-xs font-semibold rounded-xl border border-slate-300 px-3 py-1.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">👥 All Team Members (Owner View)</option>
                {teamEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id.toString()}>
                    👤 {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Visits List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin h-8 w-8 rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : visits.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700">No field visits found</p>
            <p className="text-xs text-slate-500 mt-1">
              Click "Start Field Visit" whenever you go for a client meeting or site visit.
            </p>
            <Button
              className="mt-4 bg-indigo-600 text-white"
              size="sm"
              onClick={() => setShowStartModal(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Start First Visit
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => {
              const isOngoing = visit.status === "IN_PROGRESS";

              return (
                <div
                  key={visit.id}
                  className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all ${
                    isOngoing ? "border-indigo-300 ring-2 ring-indigo-500/10" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left Details */}
                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isOngoing
                              ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {isOngoing ? "⏳ IN PROGRESS" : "✅ COMPLETED"}
                        </span>

                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {visit.purpose}
                        </span>

                        {visit.outcome && (
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              visit.outcome === "DEAL_CLOSED"
                                ? "bg-emerald-100 text-emerald-800"
                                : visit.outcome === "INTERESTED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            Outcome: {visit.outcome.replace("_", " ")}
                          </span>
                        )}

                        {visit.durationMinutes && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {visit.durationMinutes} mins meeting
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Building className="h-4 w-4 text-indigo-600" /> {visit.clientName}
                          {visit.clientPhone && (
                            <a
                              href={`tel:${visit.clientPhone}`}
                              className="text-xs font-mono text-slate-500 font-normal hover:text-indigo-600 flex items-center gap-1"
                            >
                              <Phone className="h-3 w-3" /> {visit.clientPhone}
                            </a>
                          )}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Conducted by: <strong>{visit.user?.name || "Agent"}</strong> ({visit.user?.email})
                        </p>
                      </div>

                      {/* Timings & Locations */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <p className="font-semibold text-slate-800 flex items-center gap-1">
                            🟢 Check-In: {format(new Date(visit.checkInTime), "hh:mm a (dd MMM)")}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {visit.checkInLocation || "Location recorded"}
                          </p>
                          {visit.checkInLat && visit.checkInLng && (
                            <a
                              href={`https://maps.google.com/?q=${visit.checkInLat},${visit.checkInLng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <ExternalLink className="h-2.5 w-2.5" /> View Check-In on Google Maps
                            </a>
                          )}
                        </div>

                        {visit.checkOutTime ? (
                          <div>
                            <p className="font-semibold text-slate-800 flex items-center gap-1">
                              🔴 Check-Out: {format(new Date(visit.checkOutTime), "hh:mm a (dd MMM)")}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {visit.checkOutLocation || "Location recorded"}
                            </p>
                            {visit.checkOutLat && visit.checkOutLng && (
                              <a
                                href={`https://maps.google.com/?q=${visit.checkOutLat},${visit.checkOutLng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <ExternalLink className="h-2.5 w-2.5" /> View Check-Out on Google Maps
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                              Meeting Currently In Progress...
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Notes / Outcome Summary */}
                      {visit.notes && (
                        <div className="text-xs bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                          <strong className="text-slate-700 block mb-0.5">Discussion Notes:</strong>
                          <p className="text-slate-600 whitespace-pre-wrap">{visit.notes}</p>
                        </div>
                      )}

                      {visit.amountCollected && (
                        <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl inline-block border border-emerald-200">
                          💰 Payment / Advance Collected: ₹{visit.amountCollected.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Right Photos & Actions */}
                    <div className="flex lg:flex-col items-center lg:items-end gap-2 flex-shrink-0">
                      {/* Check-In / Check-Out Photos */}
                      <div className="flex gap-2">
                        {visit.checkInPhotoUrl && (
                          <div className="text-center">
                            <img
                              src={visit.checkInPhotoUrl}
                              alt="Check-in Photo"
                              className="h-16 w-16 rounded-xl object-cover border border-slate-200 cursor-pointer shadow-2xs hover:opacity-90"
                              onClick={() => setPreviewImage(visit.checkInPhotoUrl)}
                            />
                            <span className="text-[9px] text-slate-500 font-semibold mt-0.5 block">
                              Arrival
                            </span>
                          </div>
                        )}
                        {visit.checkOutPhotoUrl && (
                          <div className="text-center">
                            <img
                              src={visit.checkOutPhotoUrl}
                              alt="Check-out Photo"
                              className="h-16 w-16 rounded-xl object-cover border border-slate-200 cursor-pointer shadow-2xs hover:opacity-90"
                              onClick={() => setPreviewImage(visit.checkOutPhotoUrl)}
                            />
                            <span className="text-[9px] text-slate-500 font-semibold mt-0.5 block">
                              Departure
                            </span>
                          </div>
                        )}
                      </div>

                      {isOngoing && (
                        <Button
                          size="sm"
                          onClick={() => setCheckoutTargetVisit(visit)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Check Out
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
