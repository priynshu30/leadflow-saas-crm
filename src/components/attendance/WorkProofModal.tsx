"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Camera, Mic, Square, Play, Pause, Upload, FileText, Music, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface WorkProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  defaultLeadId?: number | null;
  defaultLeadName?: string | null;
}

export function WorkProofModal({
  isOpen,
  onClose,
  onSubmitted,
  defaultLeadId,
  defaultLeadName,
}: WorkProofModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioMode, setAudioMode] = useState<"upload" | "record">("upload");
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(defaultLeadId || null);
  const [leadsList, setLeadsList] = useState<{ id: number; name: string; phone: string }[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch leads for optional tagging if not pre-set
      if (!defaultLeadId) {
        fetch("/api/leads?limit=50")
          .then((res) => res.json())
          .then((data) => {
            if (data.leads) {
              setLeadsList(data.leads);
            }
          })
          .catch(() => {});
      } else {
        setSelectedLeadId(defaultLeadId);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, [isOpen, defaultLeadId]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast("Image must be under 8MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      showToast("Photo attached!", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showToast("Audio recording file must be under 15MB", "error");
      return;
    }

    setAudioFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAudioUrl(reader.result as string);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      setIsPlayingAudio(false);
      showToast(`Audio "${file.name}" uploaded!`, "success");
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          setAudioUrl(reader.result as string);
          setAudioFileName("Voice_Note_" + new Date().toLocaleTimeString().replace(/\s+/g, "_") + ".webm");
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
      showToast("Recording started...", "success");
    } catch {
      showToast("Microphone permission denied. Use 'Upload Call Recording' instead.", "error");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    showToast("Recording saved successfully!", "success");
  };

  const toggleAudioPlay = () => {
    if (!audioUrl) return;
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlayingAudio(false);
    }
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play().catch(() => {
        showToast("Audio playback error", "error");
      });
      setIsPlayingAudio(true);
    }
  };

  const clearAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setAudioUrl(null);
    setAudioFileName(null);
    setIsPlayingAudio(false);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Task / Proof title is required", "error");
      return;
    }
    setLoading(true);
    try {
      let lat: number | null = null;
      let lng: number | null = null;
      let locationName: string | null = null;
      try {
        await new Promise<void>((resolve) => {
          navigator.geolocation?.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 4000 }
          );
        });
        if (lat && lng) {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          locationName = data.display_name?.split(",").slice(0, 3).join(", ") || null;
        }
      } catch { /* ignore */ }

      const res = await fetch("/api/work-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          imageUrl,
          audioUrl,
          leadId: selectedLeadId || null,
          latitude: lat,
          longitude: lng,
          locationName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      showToast("Work proof logged successfully!", "success");
      setTitle("");
      setDescription("");
      setImageUrl(null);
      clearAudio();
      onSubmitted();
      onClose();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 my-auto">
        <div className="p-5 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" /> Log Work & Field Proof
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {defaultLeadName
                ? `Tagging activity to client: ${defaultLeadName}`
                : "Submit visit notes, site photos, call recordings & GPS proof"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Optional Lead / Client Tag */}
          {!defaultLeadId && leadsList.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-indigo-600" /> Link to Client / Lead (Optional)
              </label>
              <select
                value={selectedLeadId || ""}
                onChange={(e) => setSelectedLeadId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- General Activity / Not Linked to Specific Lead --</option>
                {leadsList.map((ld) => (
                  <option key={ld.id} value={ld.id}>
                    {ld.name} ({ld.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Activity / Task Title *"
            type="text"
            placeholder="e.g. Site Visit & Price Discussion / Client Call"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            leftIcon={<FileText className="h-4 w-4" />}
            required
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Discussion Notes / Next Action
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was discussed? Deal status? Client requirement notes..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Photo Proof Section */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-indigo-600" /> Photo / Site Proof (Optional)
              </p>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="text-[11px] text-rose-600 font-semibold hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <img src={imageUrl} alt="proof" className="w-full max-h-44 object-cover" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => imageFileInputRef.current?.click()}
                  className="text-xs border-dashed border-indigo-300 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload Photo from Device / Camera
                </Button>
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            )}
          </div>

          {/* Audio / Call Recording Section */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Music className="h-3.5 w-3.5 text-emerald-600" /> Call Recording / Audio Proof (Optional)
              </p>
              {audioUrl && (
                <button
                  type="button"
                  onClick={clearAudio}
                  className="text-[11px] text-rose-600 font-semibold hover:underline"
                >
                  Remove Audio
                </button>
              )}
            </div>

            {/* Audio Options */}
            {!audioUrl ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAudioMode("upload")}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors ${
                      audioMode === "upload"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    📁 Upload Call Recording
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudioMode("record")}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors ${
                      audioMode === "record"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    🎙️ Record Live Audio
                  </button>
                </div>

                {audioMode === "upload" && (
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => audioFileInputRef.current?.click()}
                      className="text-xs border-dashed border-emerald-300 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" /> Choose Call Recording (.mp3, .m4a, .wav)
                    </Button>
                    <input
                      ref={audioFileInputRef}
                      type="file"
                      accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.amr"
                      className="hidden"
                      onChange={handleAudioFileUpload}
                    />
                  </div>
                )}

                {audioMode === "record" && (
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      variant={isRecording ? "secondary" : "primary"}
                      onClick={isRecording ? stopRecording : startRecording}
                      className={isRecording ? "bg-rose-100 text-rose-700 border-rose-300" : "bg-emerald-600 hover:bg-emerald-700"}
                    >
                      {isRecording ? (
                        <>
                          <Square className="h-3 w-3 mr-1.5 fill-current" /> Stop ({formatTime(recordingTime)})
                        </>
                      ) : (
                        <>
                          <Mic className="h-3 w-3 mr-1.5" /> Start Mic Recording
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-emerald-200">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={toggleAudioPlay}
                  className="bg-emerald-50 border-emerald-200 text-emerald-700"
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause className="h-3 w-3 mr-1.5" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1.5" /> Play Recording
                    </>
                  )}
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">{audioFileName || "Attached Audio"}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Ready to attach to proof</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700" size="sm">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Submit Work Proof
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
