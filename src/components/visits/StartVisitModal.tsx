"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin,
  Camera,
  X,
  CheckCircle2,
  Building,
  User,
  Phone,
  Briefcase,
  Upload,
  RefreshCw,
  Video,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { compressImage } from "@/lib/imageUtils";

interface StartVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVisitStarted: () => void;
  defaultLeadId?: number;
  defaultClientName?: string;
  defaultClientPhone?: string;
}

const VISIT_PURPOSES = [
  "Site Visit / Property Tour",
  "Client Meeting / Discussion",
  "Product Demo / Presentation",
  "Payment Collection / Advance",
  "Document Pickup / Verification",
  "Service / Installation Visit",
  "Other Field Meeting",
];

export function StartVisitModal({
  isOpen,
  onClose,
  onVisitStarted,
  defaultLeadId,
  defaultClientName,
  defaultClientPhone,
}: StartVisitModalProps) {
  const { showToast } = useToast();

  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<number | "">(defaultLeadId || "");
  const [clientName, setClientName] = useState(defaultClientName || "");
  const [clientPhone, setClientPhone] = useState(defaultClientPhone || "");
  const [purpose, setPurpose] = useState(VISIT_PURPOSES[0]);

  // Photo state
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [compressing, setCompressing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GPS state
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Auto fetch GPS
      getGPSLocation();

      // Fetch leads for autocomplete if not passed
      if (!defaultLeadId) {
        fetch("/api/leads?limit=100")
          .then((res) => res.json())
          .then((data) => {
            if (data.leads) setLeads(data.leads);
          })
          .catch(() => {});
      } else {
        if (defaultClientName) setClientName(defaultClientName);
        if (defaultClientPhone) setClientPhone(defaultClientPhone);
      }
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, defaultLeadId, defaultClientName, defaultClientPhone]);

  const handleLeadSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedLeadId("");
      return;
    }
    const lId = parseInt(val, 10);
    setSelectedLeadId(lId);
    const found = leads.find((l) => l.id === lId);
    if (found) {
      setClientName(found.name);
      setClientPhone(found.phone || "");
    }
  };

  const getGPSLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast("GPS Geolocation not supported", "error");
      return;
    }
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
  }, [showToast]);

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Webcam not available, please use phone camera button");
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
    } catch (err: any) {
      showToast("Please use 'Open Phone Camera' below", "error");
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
    if (!clientName.trim()) {
      showToast("Client / Location name is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLeadId || null,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim() || null,
          purpose,
          checkInLat: location?.lat || null,
          checkInLng: location?.lng || null,
          checkInLocation: location?.name || "Client Location",
          checkInPhotoUrl: photoUrl || null,
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server error while starting visit");
      }

      if (!res.ok) throw new Error(data.error || "Failed to start visit");

      showToast(`📍 Checked in at ${clientName}!`, "success");
      onVisitStarted();
      onClose();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Start Field Visit (Check-In)</h2>
              <p className="text-xs text-slate-500">Record on-site client arrival with live GPS & photo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Link to Existing Lead */}
          {!defaultLeadId && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Client / Lead (Optional)
              </label>
              <select
                value={selectedLeadId}
                onChange={handleLeadSelect}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Direct / Walk-in / New Client --</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} {l.phone ? `(${l.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Client & Purpose Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Client / Site Name *"
              placeholder="e.g. Apex Tower / Amit Gupta"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              leftIcon={<Building className="h-4 w-4" />}
              required
            />
            <Input
              label="Client Contact Number"
              placeholder="e.g. 9876543210"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              leftIcon={<Phone className="h-4 w-4" />}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Purpose of Visit *
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              {VISIT_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Photo Capture Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Site / Arrival Photo Proof (Optional)
            </label>

            <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video flex items-center justify-center border border-slate-200 shadow-inner">
              {compressing ? (
                <div className="flex flex-col items-center gap-2 text-white">
                  <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
                  <span className="text-xs">Optimizing image...</span>
                </div>
              ) : photoUrl ? (
                <img src={photoUrl} alt="check-in proof" className="w-full h-full object-cover" />
              ) : cameraStarted ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-400 p-4 text-center">
                  <Camera className="h-7 w-7 text-slate-500" />
                  <p className="text-xs text-slate-300">No Photo Attached</p>
                  <p className="text-[10px] text-slate-400">Attach site/client arrival photo</p>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Photo Action Buttons */}
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
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-start gap-2.5">
            <MapPin className={`h-4 w-4 mt-0.5 flex-shrink-0 ${location ? "text-emerald-600" : "text-slate-400"}`} />
            <div className="flex-1 min-w-0">
              {location ? (
                <>
                  <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> GPS Location Verified
                  </p>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">{location.name}</p>
                </>
              ) : (
                <p className="text-xs text-slate-500">Detecting current GPS location...</p>
              )}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={loadingGPS}
              onClick={getGPSLocation}
              className="text-[10px] px-2 py-0.5 h-auto flex-shrink-0"
            >
              {location ? "Refresh" : "Get GPS"}
            </Button>
          </div>

          {/* Footer */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={submitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Start Visit (Check-In)
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
