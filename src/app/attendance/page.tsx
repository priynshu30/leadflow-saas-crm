"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Clock, Camera, MapPin, CheckCircle2, LogIn, LogOut, Plus, Play, Pause, Image as ImageIcon, Mic, Users, Calendar, Timer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { SelfieLocationCapture } from "@/components/attendance/SelfieLocationCapture";
import { WorkProofModal } from "@/components/attendance/WorkProofModal";
import { format, formatDistanceToNow } from "date-fns";

interface AttendanceRecord {
  id: number;
  sodTime: string | null;
  sodSelfieUrl: string | null;
  sodLocationName: string | null;
  eodTime: string | null;
  eodSelfieUrl: string | null;
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
  locationName: string | null;
  createdAt: string;
  user: { id: number; name: string; avatarUrl: string | null };
}

export default function AttendancePage() {
  const { showToast } = useToast();
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord | null>(null);
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
  const [ticker, setTicker] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [attRes, wpRes] = await Promise.all([
        fetch("/api/attendance"),
        fetch("/api/work-proof"),
      ]);
      if (attRes.ok) {
        const att = await attRes.json();
        setMyAttendance(att.myTodayAttendance);
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
        body: JSON.stringify({ sodSelfieUrl: data.selfieUrl, sodLat: data.lat, sodLng: data.lng, sodLocationName: data.locationName }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
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

  const handleEODSubmit = async () => {
    if (!pendingEodData) return;
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
          eodSummary,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
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
      audio.play();
      setPlayingAudio(id);
    } else if (playingAudio === id) {
      audioPlayers[id].pause();
      setPlayingAudio(null);
    } else {
      audioPlayers[id].play();
      setPlayingAudio(id);
    }
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
      {showSelfieCapture && (
        <SelfieLocationCapture
          title={showSelfieCapture === "SOD" ? "🌅 Start of Day Clock-In" : "🌆 End of Day Clock-Out"}
          subtitle={showSelfieCapture === "SOD" ? "Take a live selfie and capture your location to clock in" : "Take a final selfie and capture location to clock out"}
          onCapture={showSelfieCapture === "SOD" ? handleSODCapture : handleEODCaptureStep1}
          onCancel={() => setShowSelfieCapture(null)}
        />
      )}

      {showEodSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 p-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-base">📝 EOD Work Summary</h2>
            <p className="text-xs text-slate-500">Briefly describe what you accomplished today</p>
            <textarea rows={5} value={eodSummary} onChange={(e) => setEodSummary(e.target.value)}
              placeholder="Summarize your day's work, deals closed, meetings done, targets achieved..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" size="sm" onClick={() => setShowEodSummary(false)}>Back</Button>
              <Button className="flex-1" size="sm" loading={submitting} onClick={handleEODSubmit}>Complete EOD</Button>
            </div>
          </div>
        </div>
      )}

      {showWorkProof && (
        <WorkProofModal isOpen={showWorkProof} onClose={() => setShowWorkProof(false)} onSubmitted={fetchData} />
      )}

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Field Attendance & Work Tracking</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {format(new Date(), "EEEE, dd MMMM yyyy")}
            </p>
          </div>
          <Button onClick={() => setShowWorkProof(true)} size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Log Work Proof
          </Button>
        </div>

        {/* Today's Status Card */}
        <div className={`rounded-2xl border p-5 ${!isClocked ? "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200" : isClockedOut ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200" : "bg-gradient-to-br from-indigo-50 to-blue-100 border-indigo-200"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-xl ${!isClocked ? "bg-white text-slate-500" : isClockedOut ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"}`}>
                {!isClocked ? "😴" : isClockedOut ? "✅" : "💼"}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">
                  {!isClocked ? "Not Clocked In Yet" : isClockedOut ? "Day Complete — Clocked Out" : "Currently Working"}
                </p>
                <p className="text-xs text-slate-600">
                  {myAttendance?.sodTime
                    ? `SOD: ${format(new Date(myAttendance.sodTime), "hh:mm a")}`
                    : "Clock in to start your day"}
                  {myAttendance?.eodTime ? ` · EOD: ${format(new Date(myAttendance.eodTime), "hh:mm a")}` : ""}
                </p>
                {isClocked && !isClockedOut && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Timer className="h-3 w-3 text-indigo-600" />
                    <span className="text-xs font-semibold text-indigo-700">{getWorkingDuration()} working</span>
                  </div>
                )}
                {isClockedOut && getWorkingDuration() && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Timer className="h-3 w-3 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700">Total: {getWorkingDuration()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {!isClocked && (
                <Button onClick={() => setShowSelfieCapture("SOD")} loading={submitting}>
                  <LogIn className="h-4 w-4 mr-1.5" /> Clock In (SOD)
                </Button>
              )}
              {isClocked && !isClockedOut && (
                <Button onClick={() => setShowSelfieCapture("EOD")} loading={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <LogOut className="h-4 w-4 mr-1.5" /> Clock Out (EOD)
                </Button>
              )}
            </div>
          </div>

          {/* SOD / EOD Selfie Preview */}
          {myAttendance && (
            <div className="mt-4 flex flex-wrap gap-3">
              {myAttendance.sodSelfieUrl && (
                <div className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 text-xs">
                  <img src={myAttendance.sodSelfieUrl} alt="SOD" className="h-8 w-8 rounded-lg object-cover" />
                  <div>
                    <p className="font-semibold text-slate-700">SOD Selfie</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{myAttendance.sodLocationName}</p>
                  </div>
                </div>
              )}
              {myAttendance.eodSelfieUrl && (
                <div className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 text-xs">
                  <img src={myAttendance.eodSelfieUrl} alt="EOD" className="h-8 w-8 rounded-lg object-cover" />
                  <div>
                    <p className="font-semibold text-slate-700">EOD Selfie</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{myAttendance.eodLocationName}</p>
                  </div>
                </div>
              )}
              {myAttendance.eodSummary && (
                <div className="flex-1 bg-white/70 rounded-xl px-3 py-2 text-xs">
                  <p className="font-semibold text-slate-700 mb-0.5">EOD Summary</p>
                  <p className="text-slate-600">{myAttendance.eodSummary}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin Stats */}
        {userRole === "ADMIN" && teamAttendance.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">{teamAttendance.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total Agents</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{clockedInCount}</p>
              <p className="text-xs text-slate-500 mt-0.5">Currently In</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-500">{clockedOutCount}</p>
              <p className="text-xs text-slate-500 mt-0.5">Clocked Out</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { key: "attendance", label: "📋 My Today", icon: Calendar },
            { key: "workproofs", label: "📂 Work Proofs", icon: ImageIcon },
            ...(userRole === "ADMIN" ? [{ key: "team", label: "👥 Team Attendance", icon: Users }] : []),
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg transition-all ${activeTab === tab.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "workproofs" && (
          <div className="space-y-3">
            {workProofs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">No work proofs logged yet</p>
                <p className="text-xs mt-1">Click "Log Work Proof" to add your first entry</p>
              </div>
            ) : (
              workProofs.map((wp) => (
                <div key={wp.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{wp.title}</p>
                      {wp.description && <p className="text-xs text-slate-600 mt-0.5">{wp.description}</p>}
                    </div>
                    <p className="text-[10px] text-slate-400 flex-shrink-0">{formatDistanceToNow(new Date(wp.createdAt), { addSuffix: true })}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {wp.imageUrl && (
                      <img src={wp.imageUrl} alt="proof" className="h-16 w-16 rounded-lg object-cover border border-slate-200 cursor-pointer" onClick={() => window.open(wp.imageUrl!, "_blank")} />
                    )}
                    {wp.audioUrl && (
                      <button type="button" onClick={() => toggleAudio(wp.id, wp.audioUrl!)}
                        className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold">
                        {playingAudio === wp.id ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        {playingAudio === wp.id ? "Pause" : "Play Recording"}
                      </button>
                    )}
                  </div>
                  {wp.locationName && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {wp.locationName}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {wp.user.avatarUrl ? (
                      <img src={wp.user.avatarUrl} alt={wp.user.name} className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">{wp.user.name[0]}</div>
                    )}
                    <span className="text-[11px] text-slate-600 font-medium">{wp.user.name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "team" && userRole === "ADMIN" && (
          <div className="space-y-3">
            {teamAttendance.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">No team attendance data for today yet.</div>
            ) : (
              teamAttendance.map((a) => (
                <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    {a.user?.avatarUrl ? (
                      <img src={a.user.avatarUrl} alt={a.user?.name} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm">
                        {a.user?.name?.[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-slate-900">{a.user?.name}</p>
                      <p className="text-xs text-slate-500">{a.user?.email}</p>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${a.status === "CLOCKED_IN" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {a.status === "CLOCKED_IN" ? "🟢 Working" : "⚫ Clocked Out"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 items-start">
                    {a.sodSelfieUrl && (
                      <div className="flex items-center gap-2">
                        <img src={a.sodSelfieUrl} alt="SOD" className="h-10 w-10 rounded-lg object-cover border border-slate-200" />
                        <div>
                          <p className="text-[10px] font-semibold text-slate-600">SOD: {a.sodTime ? format(new Date(a.sodTime), "hh:mm a") : "-"}</p>
                          {a.sodLocationName && <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{a.sodLocationName}</p>}
                        </div>
                      </div>
                    )}
                    {a.eodSelfieUrl && (
                      <div className="flex items-center gap-2">
                        <img src={a.eodSelfieUrl} alt="EOD" className="h-10 w-10 rounded-lg object-cover border border-slate-200" />
                        <div>
                          <p className="text-[10px] font-semibold text-slate-600">EOD: {a.eodTime ? format(new Date(a.eodTime), "hh:mm a") : "-"}</p>
                          {a.eodLocationName && <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{a.eodLocationName}</p>}
                        </div>
                      </div>
                    )}
                    {a.eodSummary && (
                      <div className="flex-1 bg-slate-50 rounded-lg px-3 py-1.5">
                        <p className="text-[10px] font-semibold text-slate-600 mb-0.5">EOD Summary</p>
                        <p className="text-xs text-slate-700">{a.eodSummary}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
            {myAttendance ? (
              <div className="space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-900">Today's attendance recorded</p>
                <p className="text-xs text-slate-500">Check Work Proofs tab to log your field activities</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Clock className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">Clock In to Start Your Day</p>
                <p className="text-xs text-slate-500">A live selfie and GPS location will be captured</p>
                <Button onClick={() => setShowSelfieCapture("SOD")} className="mt-3">
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
