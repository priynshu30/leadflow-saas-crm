"use client";

import React, { useState, useRef } from "react";
import { X, Camera, Mic, MicOff, Square, Play, Pause, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface WorkProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export function WorkProofModal({ isOpen, onClose, onSubmitted }: WorkProofModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast("Image must be under 3MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
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
        reader.onload = () => setAudioUrl(reader.result as string);
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
      showToast("Microphone access denied", "error");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    showToast("Recording saved!", "success");
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
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

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
            (pos) => { lat = pos.coords.latitude; lng = pos.coords.longitude; resolve(); },
            () => resolve(),
            { timeout: 5000 }
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
        body: JSON.stringify({ title, description, imageUrl, audioUrl, latitude: lat, longitude: lng, locationName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast("Work proof logged successfully!", "success");
      setTitle("");
      setDescription("");
      setImageUrl(null);
      setAudioUrl(null);
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
            <h2 className="font-bold text-slate-900 text-base">📋 Log Work Proof</h2>
            <p className="text-xs text-slate-500 mt-0.5">Add task details, photo evidence & audio recording</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input label="Task / Proof Title *" type="text" placeholder="e.g. Site Visit at DLF Phase 3" value={title}
            onChange={(e) => setTitle(e.target.value)} leftIcon={<FileText className="h-4 w-4" />} required />

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Work Description</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What work was done, what was discussed..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Photo Proof */}
          <div className="rounded-xl border border-dashed border-slate-300 p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><Camera className="h-3.5 w-3.5 text-indigo-600" /> Photo Proof</p>
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt="proof" className="w-full rounded-lg max-h-32 object-cover" />
                <button type="button" onClick={() => setImageUrl(null)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                <Upload className="h-3.5 w-3.5" /> Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>

          {/* Audio Recording */}
          <div className="rounded-xl border border-dashed border-slate-300 p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><Mic className="h-3.5 w-3.5 text-emerald-600" /> Voice / Call Recording</p>
            <div className="flex items-center gap-2">
              {!audioUrl && (
                <Button type="button" size="sm" variant={isRecording ? "secondary" : "primary"}
                  onClick={isRecording ? stopRecording : startRecording}
                  className={isRecording ? "bg-red-100 text-red-700 border-red-200" : ""}>
                  {isRecording ? (
                    <><Square className="h-3 w-3 mr-1" /> Stop ({formatTime(recordingTime)})</>
                  ) : (
                    <><Mic className="h-3 w-3 mr-1" /> Start Recording</>
                  )}
                </Button>
              )}
              {audioUrl && (
                <>
                  <Button type="button" size="sm" variant="secondary" onClick={toggleAudioPlay}>
                    {isPlayingAudio ? <><Pause className="h-3 w-3 mr-1" /> Pause</> : <><Play className="h-3 w-3 mr-1" /> Play</>}
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => { setAudioUrl(null); audioPlayerRef.current = null; }}
                    className="text-red-600 border-red-200 hover:bg-red-50">
                    <MicOff className="h-3 w-3 mr-1" /> Remove
                  </Button>
                  <span className="text-[11px] text-emerald-600 font-semibold">✓ Recording saved</span>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose} size="sm">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1" size="sm">Submit Work Proof</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
