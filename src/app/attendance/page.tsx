"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Camera,
  MapPin,
  CheckCircle2,
  LogIn,
  LogOut,
  Plus,
  Play,
  Pause,
  Image as ImageIcon,
  Users,
  Calendar,
  Timer,
  ExternalLink,
  Music,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { SelfieLocationCapture } from "@/components/attendance/SelfieLocationCapture";
import { WorkProofModal } from "@/components/attendance/WorkProofModal";
import { format, formatDistanceToNow } from "date-fns";

interface AttendanceRecord {
  id: number;
  sodTime: string | null;
  sodSelfieUrl: string | null;
  sodLat: number | null;
  sodLng: number | null;
  sodLocationName: string | null;
  eodTime: string | null;
  eodSelfieUrl: string | null;
  eodLat: number | null;
  eodLng: number | null;
  eodLocationName: string | null;
  eodSummary: string | null;
  status: string;
  user?: { id: number; name: string; email: string; avatarUrl: string | null; role: string };
}

interface WorkProofRecord {
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

export default function AttendancePage() {
  const { showToast } = useToast();
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord | null>(null);
  const [myTodayProofsCount, setMyTodayProofsCount] = useState<number>(0);
  const [teamAttendance, setTeamAttendance] = useState<AttendanceRecord[]>([]);
  const [workProofs, setWorkProofs] = useState<WorkProofRecord[]>([]);
  const [userRole, setUserRole] = useState<"ADMIN" | "AGENT">("AGENT");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSelfieCapture, setShowSelfieCapture] = useState<"SOD" | "EOD" | null>(null);
  const [showWorkProof, setShowWorkProof] = useState(false);
  const [activeTab, setActiveTab] = useState<"attendance" | "workproofs" | "team">("attendance");
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const [audioPlayers, setAudioPlayers] = useState<Record<number, HTMLAudioElement>>({});
  const [eodSummary, setEodSummary] = useState("");
  const [showEodSummary, setShowEodSummary] = useState(false);
  const [pendingEodData, setPendingEodData] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [, setTicker] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [attRes, wpRes] = await Promise.all([
        fetch("/api/attendance"),
        fetch("/api/work-proof"),
      ]);
      if (attRes.ok) {
        const att = await attRes.json();
        setMyAttendance(att.myTodayAttendance);
        setMyTodayProofsCount(att.myTodayProofsCount || 0);
        setTeamAttendance(att.teamTodayAttendance || []);
        setUserRole(att.userRole === "ADMIN" ? "ADMIN" : "AGENT");
      }
      if (wpRes.ok) {
        const wp = await wpRes.json();
        setWorkProofs(wp.workProofs || []);
      }
    } catch {
      showToast("Failed to load attendance data", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => setTicker((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getWorkingDuration = () => {
    if (!myAttendance?.sodTime) return null;
    const sod = new Date(myAttendance.sodTime);
    const end = myAttendance.eodTime ? new Date(myAttendance.eodTime) : new Date();
    const diffMs = end.getTime() - sod.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  const handleSODCapture = async (data: any) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sodSelfieUrl: data.selfieUrl,
          sodLat: data.lat,
          sodLng: data.lng,
          sodLocationName: data.locationName,
        }),
      });
      const text = await res.text();
      let result: any = {};
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(res.status === 413 ? "Photo is too large. Please retake photo." : `Server error (${res.status})`);
      }
      if (!res.ok) throw new Error(result.error || "Failed to clock in");
      showToast("✅ Clocked In (SOD) with selfie & location!", "success");
      setShowSelfieCapture(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEODCaptureStep1 = async (data: any) => {
    setPendingEodData(data);
    setShowSelfieCapture(null);
    setShowEodSummary(true);
  };

  const startEODFlow = () => {
    if (myTodayProofsCount === 0) {
      showToast("⚠️ Work proof required! You must log at least 1 work proof (photo or recording) before clocking out.", "error");
      setShowWorkProof(true);
      return;
    }
    setShowSelfieCapture("EOD");
  };

  const handleEODSubmit = async () => {
    if (!pendingEodData) return;
    if (!eodSummary.trim() || eodSummary.trim().length < 5) {
      showToast("Please write an EOD work summary (minimum 5 characters).", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eodSelfieUrl: pendingEodData.selfieUrl,
          eodLat: pendingEodData.lat,
          eodLng: pendingEodData.lng,
          eodLocationName: pendingEodData.locationName,
          eodSummary: eodSummary.trim(),
        }),
      });
      const text = await res.text();
      let result: any = {};
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(res.status === 413 ? "Photo is too large. Please retake photo." : `Server error (${res.status})`);
      }
      if (!res.ok) {
        if (result.needsWorkProof) {
          setShowEodSummary(false);
          setShowWorkProof(true);
        }
        throw new Error(result.error || "Failed to clock out");
      }
      showToast("✅ Clocked Out (EOD) successfully!", "success");
      setShowEodSummary(false);
      setEodSummary("");
      setPendingEodData(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
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

  const handleExportExcel = () => {
    const recordsToExport =
      userRole === "ADMIN" && teamAttendance.length > 0
        ? teamAttendance
        : myAttendance
        ? [myAttendance]
        : [];

    if (recordsToExport.length === 0) {
      showToast("No attendance data to export", "error");
      return;
    }

    const rows = recordsToExport.map((rec) => {
      let durationStr = "—";
      if (rec.sodTime) {
        const sod = new Date(rec.sodTime);
        const end = rec.eodTime ? new Date(rec.eodTime) : new Date();
        const diffMs = end.getTime() - sod.getTime();
        const hours = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        durationStr = `${hours}h ${mins}m`;
      }
      return {
        "Employee Name": rec.user?.name || "Self",
        Email: rec.user?.email || "—",
        Date: format(new Date(), "yyyy-MM-dd"),
        Status: rec.status === "CLOCKED_IN" ? "Clocked In (Working)" : "Clocked Out",
        "Clock In (SOD)": rec.sodTime ? format(new Date(rec.sodTime), "hh:mm a") : "—",
        "SOD Location": rec.sodLocationName || "—",
        "Clock Out (EOD)": rec.eodTime ? format(new Date(rec.eodTime), "hh:mm a") : "—",
        "EOD Location": rec.eodLocationName || "—",
        "Total Shift Duration": durationStr,
        "EOD Work Summary": rec.eodSummary || "—",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");
    XLSX.writeFile(workbook, `Attendance_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    showToast("Attendance Excel downloaded successfully!", "success");
  };

  const isClocked = !!myAttendance;
  const isClockedOut = myAttendance?.status === "CLOCKED_OUT";
  const clockedInCount = teamAttendance.filter((a) => a.status === "CLOCKED_IN").length;
  const clockedOutCount = teamAttendance.filter((a) => a.status === "CLOCKED_OUT").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {/* Selfie / Location Capture Modal */}
      {showSelfieCapture && (
        <SelfieLocationCapture
          title={showSelfieCapture === "SOD" ? "🌅 Start of Day Clock-In" : "🌆 End of Day Clock-Out"}
          subtitle={
            showSelfieCapture === "SOD"
              ? "Take a live selfie and verify your location to start your day"
              : "Capture your end-of-day selfie and location to clock out"
          }
          onCapture={showSelfieCapture === "SOD" ? handleSODCapture : handleEODCaptureStep1}
          onCancel={() => setShowSelfieCapture(null)}
        />
      )}

      {/* EOD Summary Modal */}
      {showEodSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-base">📝 End of Day (EOD) Summary</h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {myTodayProofsCount} Proofs Attached
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Summarize your tasks, customer visits, calls and conversions for today
            </p>
            <textarea
              rows={4}
              value={eodSummary}
              onChange={(e) => setEodSummary(e.target.value)}
              placeholder="e.g. Completed 4 client calls, 1 site visit, converted 1 lead..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            {myTodayProofsCount === 0 && (
              <p className="text-[11px] text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-medium">
                ⚠️ You must log at least 1 work proof (photo or recording) before clocking out.
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" size="sm" onClick={() => setShowEodSummary(false)}>
                Back
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                size="sm"
                loading={submitting}
                disabled={!eodSummary.trim() || eodSummary.trim().length < 5}
                onClick={handleEODSubmit}
              >
                Complete Clock-Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Work Proof Modal */}
      {showWorkProof && (
        <WorkProofModal isOpen={showWorkProof} onClose={() => setShowWorkProof(false)} onSubmitted={fetchData} />
      )}

      {/* Full Image Preview Modal */}
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

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Field Attendance & Work Proofs</h1>
            <p className="text-sm text-slate-500 mt-0.5">{format(new Date(), "EEEE, dd MMMM yyyy")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {userRole === "ADMIN" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportExcel}
                className="border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                <Download className="h-3.5 w-3.5 mr-1.5 text-slate-600" /> Export Attendance (Excel)
              </Button>
            )}
            <Button onClick={() => setShowWorkProof(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Log Work / Call Proof
            </Button>
          </div>
        </div>

        {/* Today's Status Banner Card */}
        <div
          className={`rounded-2xl border p-5 transition-all ${
            !isClocked
              ? "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200"
              : isClockedOut
              ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
              : "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 shadow-xs"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl shadow-xs ${
                  !isClocked
                    ? "bg-white text-slate-500 border border-slate-200"
                    : isClockedOut
                    ? "bg-emerald-600 text-white"
                    : "bg-indigo-600 text-white"
                }`}
              >
                {!isClocked ? "😴" : isClockedOut ? "🏁" : "⚡"}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">
                  {!isClocked
                    ? "Not Clocked In Yet"
                    : isClockedOut
                    ? "Day Complete — Clocked Out"
                    : "Currently On Duty (Clocked In)"}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {myAttendance?.sodTime
                    ? `SOD: ${format(new Date(myAttendance.sodTime), "hh:mm a")}`
                    : "Click Clock In (SOD) to start your shift with selfie + GPS"}
                  {myAttendance?.eodTime ? ` · EOD: ${format(new Date(myAttendance.eodTime), "hh:mm a")}` : ""}
                </p>
                {isClocked && !isClockedOut && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Timer className="h-3.5 w-3.5 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-700">{getWorkingDuration()} on duty</span>
                  </div>
                )}
                {isClockedOut && getWorkingDuration() && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Timer className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">Total Shift: {getWorkingDuration()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex gap-2">
              {!isClocked && (
                <Button
                  onClick={() => setShowSelfieCapture("SOD")}
                  loading={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  <LogIn className="h-4 w-4 mr-1.5" /> Clock In (SOD)
                </Button>
              )}
              {isClocked && !isClockedOut && (
                <Button
                  onClick={startEODFlow}
                  loading={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  <LogOut className="h-4 w-4 mr-1.5" /> Clock Out (EOD)
                </Button>
              )}
            </div>
          </div>

          {/* SOD / EOD Selfie & Location Preview */}
          {myAttendance && (
            <div className="mt-4 pt-4 border-t border-slate-200/70 flex flex-wrap gap-3">
              {myAttendance.sodSelfieUrl && (
                <div className="flex items-center gap-2.5 bg-white/90 rounded-xl p-2.5 border border-slate-200/80 text-xs shadow-2xs">
                  <img
                    src={myAttendance.sodSelfieUrl}
                    alt="SOD"
                    className="h-10 w-10 rounded-lg object-cover cursor-pointer border border-slate-200"
                    onClick={() => setPreviewImage(myAttendance.sodSelfieUrl)}
                  />
                  <div>
                    <p className="font-bold text-slate-800">SOD Selfie & Location</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[170px]">{myAttendance.sodLocationName}</p>
                    {myAttendance.sodLat && myAttendance.sodLng && (
                      <a
                        href={`https://maps.google.com/?q=${myAttendance.sodLat},${myAttendance.sodLng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5 hover:underline"
                      >
                        <ExternalLink className="h-2.5 w-2.5" /> View Map
                      </a>
                    )}
                  </div>
                </div>
              )}

              {myAttendance.eodSelfieUrl && (
                <div className="flex items-center gap-2.5 bg-white/90 rounded-xl p-2.5 border border-slate-200/80 text-xs shadow-2xs">
                  <img
                    src={myAttendance.eodSelfieUrl}
                    alt="EOD"
                    className="h-10 w-10 rounded-lg object-cover cursor-pointer border border-slate-200"
                    onClick={() => setPreviewImage(myAttendance.eodSelfieUrl)}
                  />
                  <div>
                    <p className="font-bold text-slate-800">EOD Selfie & Location</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[170px]">{myAttendance.eodLocationName}</p>
                    {myAttendance.eodLat && myAttendance.eodLng && (
                      <a
                        href={`https://maps.google.com/?q=${myAttendance.eodLat},${myAttendance.eodLng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5 hover:underline"
                      >
                        <ExternalLink className="h-2.5 w-2.5" /> View Map
                      </a>
                    )}
                  </div>
                </div>
              )}

              {myAttendance.eodSummary && (
                <div className="flex-1 min-w-[220px] bg-white/90 rounded-xl p-2.5 border border-slate-200/80 text-xs">
                  <p className="font-bold text-slate-800 mb-0.5">EOD Summary</p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{myAttendance.eodSummary}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin Overview Stats */}
        {userRole === "ADMIN" && teamAttendance.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-black text-indigo-600">{teamAttendance.length}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Total Agents</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-black text-emerald-600">{clockedInCount}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Currently In Duty</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-black text-slate-500">{clockedOutCount}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Completed EOD</p>
            </div>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          {[
            { key: "attendance", label: "📋 My Status", icon: Calendar },
            { key: "workproofs", label: `📂 Work Proofs (${workProofs.length})`, icon: ImageIcon },
            ...(userRole === "ADMIN" ? [{ key: "team", label: `👥 Team Attendance (${teamAttendance.length})`, icon: Users }] : []),
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 text-xs font-bold py-2 px-3 rounded-xl transition-all ${
                activeTab === tab.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Work Proofs Feed */}
        {activeTab === "workproofs" && (
          <div className="space-y-3">
            {workProofs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
                <ImageIcon className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-bold text-slate-700">No work proofs logged yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Field agents can log photos, visit notes, and call recordings anytime.
                </p>
                <Button onClick={() => setShowWorkProof(true)} size="sm" className="mt-4 bg-indigo-600 text-white">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Log First Work Proof
                </Button>
              </div>
            ) : (
              workProofs.map((wp) => (
                <div key={wp.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {wp.user?.avatarUrl ? (
                        <img src={wp.user.avatarUrl} alt={wp.user.name} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {wp.user?.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-900">{wp.user?.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {formatDistanceToNow(new Date(wp.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                      {format(new Date(wp.createdAt), "dd MMM, hh:mm a")}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{wp.title}</h3>
                    {wp.description && (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">
                        {wp.description}
                      </p>
                    )}
                  </div>

                  {/* Media Attachments */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {wp.imageUrl && (
                      <img
                        src={wp.imageUrl}
                        alt="proof"
                        className="h-20 w-28 rounded-xl object-cover border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setPreviewImage(wp.imageUrl)}
                      />
                    )}

                    {wp.audioUrl && (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => toggleAudio(wp.id, wp.audioUrl!)}
                          className="bg-emerald-600 text-white hover:bg-emerald-700 h-8 px-3"
                        >
                          {playingAudio === wp.id ? (
                            <>
                              <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 mr-1" /> Play Audio
                            </>
                          )}
                        </Button>
                        <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                          <Music className="h-3.5 w-3.5" /> Call / Audio Recording
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location Info */}
                  {wp.locationName && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{wp.locationName}</span>
                      {wp.latitude && wp.longitude && (
                        <a
                          href={`https://maps.google.com/?q=${wp.latitude},${wp.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 font-semibold hover:underline flex items-center gap-0.5 ml-1 flex-shrink-0"
                        >
                          <ExternalLink className="h-2.5 w-2.5" /> Map
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Admin Team Attendance View */}
        {activeTab === "team" && userRole === "ADMIN" && (
          <div className="space-y-3">
            {teamAttendance.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400 text-sm">
                No team attendance recorded for today yet.
              </div>
            ) : (
              teamAttendance.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    {a.user?.avatarUrl ? (
                      <img src={a.user.avatarUrl} alt={a.user?.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                        {a.user?.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{a.user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{a.user?.email}</p>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        a.status === "CLOCKED_IN"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {a.status === "CLOCKED_IN" ? "🟢 On Duty" : "🏁 Clocked Out"}
                    </span>
                  </div>

                  {/* Attendance Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    {/* SOD Card */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        🌅 Start of Day (SOD)
                      </p>
                      <div className="flex items-center gap-2.5">
                        {a.sodSelfieUrl ? (
                          <img
                            src={a.sodSelfieUrl}
                            alt="SOD"
                            className="h-12 w-12 rounded-lg object-cover border border-slate-200 cursor-pointer"
                            onClick={() => setPreviewImage(a.sodSelfieUrl)}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400">
                            <Camera className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800">
                            {a.sodTime ? format(new Date(a.sodTime), "hh:mm a") : "-"}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{a.sodLocationName || "GPS Location"}</p>
                          {a.sodLat && a.sodLng && (
                            <a
                              href={`https://maps.google.com/?q=${a.sodLat},${a.sodLng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-indigo-600 font-semibold hover:underline flex items-center gap-0.5 mt-0.5"
                            >
                              <ExternalLink className="h-2.5 w-2.5" /> View Map
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* EOD Card */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        🌆 End of Day (EOD)
                      </p>
                      <div className="flex items-center gap-2.5">
                        {a.eodSelfieUrl ? (
                          <img
                            src={a.eodSelfieUrl}
                            alt="EOD"
                            className="h-12 w-12 rounded-lg object-cover border border-slate-200 cursor-pointer"
                            onClick={() => setPreviewImage(a.eodSelfieUrl)}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 text-[10px] text-center p-1">
                            {a.status === "CLOCKED_IN" ? "Pending" : "No selfie"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800">
                            {a.eodTime ? format(new Date(a.eodTime), "hh:mm a") : "Shift in progress"}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{a.eodLocationName || "-"}</p>
                          {a.eodLat && a.eodLng && (
                            <a
                              href={`https://maps.google.com/?q=${a.eodLat},${a.eodLng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-indigo-600 font-semibold hover:underline flex items-center gap-0.5 mt-0.5"
                            >
                              <ExternalLink className="h-2.5 w-2.5" /> View Map
                            </a>
                          )}
                        </div>
                      </div>
                      {a.eodSummary && (
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 mt-1">
                          "{a.eodSummary}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: My Attendance details */}
        {activeTab === "attendance" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-2xs">
            {myAttendance ? (
              <div className="space-y-3 max-w-md mx-auto">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-slate-900 text-lg">Today's Attendance is Active</h3>
                <p className="text-xs text-slate-500">
                  You clocked in at{" "}
                  <span className="font-bold text-slate-700">
                    {myAttendance.sodTime ? format(new Date(myAttendance.sodTime), "hh:mm a") : ""}
                  </span>
                  . Keep adding your field activities and call recordings in the{" "}
                  <strong>Work Proofs</strong> tab.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <Button onClick={() => setShowWorkProof(true)} size="sm" className="bg-indigo-600 text-white">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Work Proof
                  </Button>
                  {!isClockedOut && (
                    <Button
                      onClick={() => setShowSelfieCapture("EOD")}
                      variant="secondary"
                      size="sm"
                      className="border-emerald-300 text-emerald-700 bg-emerald-50"
                    >
                      <LogOut className="h-3.5 w-3.5 mr-1" /> End Day (EOD)
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-w-md mx-auto">
                <div className="h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Clock className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Start Your Shift</h3>
                <p className="text-xs text-slate-500">
                  Clock in to record your Start of Day (SOD) selfie and GPS location.
                </p>
                <Button
                  onClick={() => setShowSelfieCapture("SOD")}
                  className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6"
                >
                  <LogIn className="h-4 w-4 mr-1.5" /> Clock In Now (SOD)
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
