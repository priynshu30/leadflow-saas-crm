"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin,
  Camera,
  X,
  CheckCircle2,
  DollarSign,
  FileText,
  Clock,
  Upload,
  RefreshCw,
  Video,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { compressImage } from "@/lib/imageUtils";
import { format } from "date-fns";

interface CheckOutVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVisitCompleted: () => void;
  visit: any;
}

const OUTCOMES = [
  { value: "INTERESTED", label: "🔥 Hot / Highly Interested", color: "text-amber-700 bg-amber-50" },
  { value: "DEAL_CLOSED", label: "🎉 Deal Closed / Won", color: "text-emerald-700 bg-emerald-50" },
  { value: "NEEDS_FOLLOW_UP", label: "⏳ Needs Follow-up / Quote Sent", color: "text-blue-700 bg-blue-50" },
  { value: "RESCHEDULED", label: "🔄 Re-scheduled Another Visit", color: "text-purple-700 bg-purple-50" },
  { value: "NOT_INTERESTED", label: "❌ Not Interested / Rejected", color: "text-slate-700 bg-slate-100" },
];

export function CheckOutVisitModal({
  isOpen,
  onClose,
  onVisitCompleted,
  visit,
}: CheckOutVisitModalProps) {
  const { showToast } = useToast();

  const [outcome, setOutcome] = useState("NEEDS_FOLLOW_UP");
  const [notes, setNotes] = useState("");
  const [amountCollected, setAmountCollected] = useState("");

  // Photo
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [compressing, setCompressing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GPS
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Calculate elapsed time
  const getElapsedDuration = () => {
    if (!visit?.checkInTime) return "";
    const start = new Date(visit.checkInTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const mins = Math.max(1, Math.floor(diffMs / 60000));
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 0) return `${hours} hr ${remMins} min`;
    return `${mins} minutes`;
  };

  useEffect(() => {
    if (isOpen) {
      getGPSLocation();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const getGPSLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLoadingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          name = data.display_name?.split(",").slice(0, 3).join(", ") || name;
        } catch { /* ignore geocode error */ }
        setLocation({ lat, lng, name });
        setLoadingGPS(false);
      },
      (err) => {
        setLoadingGPS(false);
        console.warn("GPS error:", err);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Webcam unavailable");
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
      setStream(mediaStream);
      setCameraStarted(true);
    } catch {
      showToast("Please use 'Open Camera' button", "error");
    }
  }, [showToast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCameraStarted(false);
  }, [stream]);

  const captureCameraFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setCompressing(true);
    try {
      const rawDataUrl = canvas.toDataURL("image/jpeg", 0.8);
      const compressed = await compressImage(rawDataUrl, 640, 0.65);
      setPhotoUrl(compressed);
      stopCamera();
    } catch {
      showToast("Failed to process photo", "error");
    } finally {
      setCompressing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressImage(file, 640, 0.65);
      setPhotoUrl(compressed);
      stopCamera();
    } catch {
      showToast("Failed to process photo", "error");
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visit?.id) return;
    if (!notes.trim() || notes.trim().length < 5) {
      showToast("Please write a brief meeting summary (at least 5 characters)", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/visits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitId: visit.id,
          checkOutLat: location?.lat || null,
          checkOutLng: location?.lng || null,
          checkOutLocation: location?.name || "Client Location",
          checkOutPhotoUrl: photoUrl || null,
          outcome,
          notes: notes.trim(),
          amountCollected: amountCollected ? parseFloat(amountCollected) : null,
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server error during checkout");
      }

      if (!res.ok) throw new Error(data.error || "Failed to complete visit");

      showToast(`✅ Field visit at ${visit.clientName} completed!`, "success");
      onVisitCompleted();
      onClose();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !visit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base">Complete Field Visit (Check-Out)</h2>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="h-3 w-3" /> {getElapsedDuration()}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Client: <strong>{visit.clientName}</strong> · Purpose: {visit.purpose}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Outcome Radio/Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Meeting Result / Outcome *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OUTCOMES.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setOutcome(o.value)}
                  className={`text-left p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    outcome === o.value
                      ? "border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/50 text-indigo-900"
                      : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Meeting Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Meeting Notes & Discussion Summary *
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Client liked 3BHK layout, budget 85L, asked for payment schedule next Monday..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Amount Collected (if deal closed) */}
          <Input
            label="Payment / Advance Collected (Optional)"
            placeholder="e.g. 50000"
            type="number"
            value={amountCollected}
            onChange={(e) => setAmountCollected(e.target.value)}
            leftIcon={<DollarSign className="h-4 w-4" />}
          />

          {/* Departure Photo Proof */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Departure Photo / Signed Doc / Meeting Photo (Optional)
            </label>

            <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video flex items-center justify-center border border-slate-200 shadow-inner">
              {compressing ? (
                <div className="flex flex-col items-center gap-2 text-white">
                  <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
                  <span className="text-xs">Optimizing image...</span>
                </div>
              ) : photoUrl ? (
                <img src={photoUrl} alt="check-out proof" className="w-full h-full object-cover" />
              ) : cameraStarted ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400 p-4 text-center">
                  <Camera className="h-6 w-6 text-slate-500" />
                  <p className="text-xs text-slate-300">No Departure Photo Attached</p>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex gap-2">
              {!photoUrl && !cameraStarted && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="h-3.5 w-3.5 mr-1" /> Open Camera
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" /> Upload Photo
                  </Button>
                </>
              )}

              {cameraStarted && !photoUrl && (
                <div className="flex gap-2 w-full">
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1 bg-emerald-600 text-white"
                    onClick={captureCameraFrame}
                  >
                    <Camera className="h-3.5 w-3.5 mr-1" /> Capture Photo
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={stopCamera}>
                    Cancel
                  </Button>
                </div>
              )}

              {photoUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setPhotoUrl(null)}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Remove / Retake Photo
                </Button>
              )}

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {/* GPS Location Bar */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 flex items-start gap-2">
            <MapPin className={`h-4 w-4 mt-0.5 flex-shrink-0 ${location ? "text-emerald-600" : "text-slate-400"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-600 truncate">
                Check-Out GPS: {location ? location.name : "Detecting..."}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={submitting}
              disabled={!notes.trim() || notes.trim().length < 5}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Complete Visit & Check-Out
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
