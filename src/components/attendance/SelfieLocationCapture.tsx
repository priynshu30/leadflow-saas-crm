"use client";

import React, { useState, useRef, useCallback } from "react";
import { Camera, MapPin, X, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface SelfieLocationCaptureProps {
  onCapture: (data: { selfieUrl: string; lat: number | null; lng: number | null; locationName: string }) => void;
  onCancel: () => void;
  title: string;
  subtitle?: string;
}

export function SelfieLocationCapture({ onCapture, onCancel, title, subtitle }: SelfieLocationCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { showToast } = useToast();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setCameraStarted(true);
    } catch {
      showToast("Camera access denied. Please allow camera permission.", "error");
    }
  }, [showToast]);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCameraStarted(false);
  }, [stream]);

  const takeSelfie = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.7);
    setSelfieUrl(dataUrl);
    stopCamera();
    showToast("Selfie captured!", "success");
  }, [stopCamera, showToast]);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast("Geolocation not supported", "error");
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
        showToast("Location captured!", "success");
      },
      () => {
        setLoadingGPS(false);
        showToast("Could not get location. Please allow location access.", "error");
      },
      { timeout: 10000 }
    );
  }, [showToast]);

  const handleConfirm = () => {
    if (!selfieUrl) {
      showToast("Please take a selfie first", "error");
      return;
    }
    onCapture({
      selfieUrl,
      lat: location?.lat ?? null,
      lng: location?.lng ?? null,
      locationName: location?.name ?? "Location not captured",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
        <div className="p-5 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Camera / Selfie Preview */}
          <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
            {selfieUrl ? (
              <img src={selfieUrl} alt="selfie" className="w-full h-full object-cover" />
            ) : cameraStarted ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Camera className="h-10 w-10" />
                <span className="text-xs">Camera not started</span>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Camera Controls */}
          <div className="flex gap-2">
            {!selfieUrl && !cameraStarted && (
              <Button type="button" className="flex-1" onClick={startCamera} size="sm">
                <Camera className="h-3.5 w-3.5 mr-1.5" /> Start Camera
              </Button>
            )}
            {cameraStarted && !selfieUrl && (
              <Button type="button" className="flex-1" onClick={takeSelfie} size="sm">
                <Camera className="h-3.5 w-3.5 mr-1.5" /> Take Selfie
              </Button>
            )}
            {selfieUrl && (
              <Button type="button" variant="secondary" className="flex-1" size="sm"
                onClick={() => { setSelfieUrl(null); startCamera(); }}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retake
              </Button>
            )}
          </div>

          {/* Location */}
          <div className="rounded-xl border border-slate-200 p-3 flex items-start gap-3">
            <MapPin className={`h-4 w-4 mt-0.5 flex-shrink-0 ${location ? "text-emerald-600" : "text-slate-400"}`} />
            <div className="flex-1 min-w-0">
              {location ? (
                <>
                  <p className="text-xs font-semibold text-emerald-700">Location Captured</p>
                  <p className="text-[11px] text-slate-500 truncate">{location.name}</p>
                </>
              ) : (
                <p className="text-xs text-slate-500">GPS location not captured</p>
              )}
            </div>
            <Button type="button" size="sm" variant="secondary" loading={loadingGPS} onClick={getLocation}
              className="text-[11px] px-2 py-1 h-auto flex-shrink-0">
              {location ? "Refresh" : "Get Location"}
            </Button>
          </div>
        </div>

        <div className="p-5 pt-0 flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} size="sm">Cancel</Button>
          <Button type="button" className="flex-1" onClick={handleConfirm} size="sm" disabled={!selfieUrl}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Confirm & Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
