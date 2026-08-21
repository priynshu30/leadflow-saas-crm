"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Camera, MapPin, X, CheckCircle2, RefreshCw, Upload, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { compressImage } from "@/lib/imageUtils";

interface SelfieLocationCaptureProps {
  onCapture: (data: { selfieUrl: string; lat: number | null; lng: number | null; locationName: string }) => void;
  onCancel: () => void;
  title: string;
  subtitle?: string;
}

export function SelfieLocationCapture({ onCapture, onCancel, title, subtitle }: SelfieLocationCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  // Auto-fetch GPS on open
  useEffect(() => {
    getLocation();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Webcam not directly supported in this browser. Please use the 'Open Phone Camera' button.");
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
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
      console.warn("Camera start failed:", err);
      setCameraError(err.message || "Camera access denied.");
      showToast("Webcam error. Please use 'Open Phone Camera' below.", "error");
    }
  }, [showToast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCameraStarted(false);
  }, [stream]);

  const takeSelfie = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(video, 0, 0, width, height);

    setCompressing(true);
    try {
      const rawDataUrl = canvas.toDataURL("image/jpeg", 0.8);
      const compressed = await compressImage(rawDataUrl, 640, 0.65);
      setSelfieUrl(compressed);
      stopCamera();
      showToast("Selfie captured!", "success");
    } catch (err) {
      showToast("Failed to process photo", "error");
    } finally {
      setCompressing(false);
    }
  }, [stopCamera, showToast]);

  // Handle native camera or photo upload with automatic compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    try {
      const compressed = await compressImage(file, 640, 0.65);
      setSelfieUrl(compressed);
      stopCamera();
      showToast("Photo captured & optimized!", "success");
    } catch (err) {
      showToast("Failed to process image file", "error");
    } finally {
      setCompressing(false);
    }
  };

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast("GPS Geolocation not supported by browser", "error");
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
        showToast("GPS location captured!", "success");
      },
      (err) => {
        setLoadingGPS(false);
        console.warn("Location error:", err);
        showToast("Could not get GPS. Please enable location permissions.", "error");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [showToast]);

  const handleConfirm = () => {
    if (!selfieUrl) {
      showToast("Please capture or upload a selfie first", "error");
      return;
    }
    onCapture({
      selfieUrl,
      lat: location?.lat ?? null,
      lng: location?.lng ?? null,
      locationName: location?.name ?? "Location captured",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 my-auto">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={() => {
              stopCamera();
              onCancel();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Photo / Camera Preview */}
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-slate-200 shadow-inner">
            {compressing ? (
              <div className="flex flex-col items-center gap-2 text-white">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                <span className="text-xs font-semibold">Processing photo...</span>
              </div>
            ) : selfieUrl ? (
              <img src={selfieUrl} alt="selfie preview" className="w-full h-full object-cover" />
            ) : cameraStarted ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400 p-4 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                  <Camera className="h-6 w-6" />
                </div>
                <p className="text-xs font-medium text-slate-300">Live Selfie Required</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Click 'Start Live Camera' or 'Open Phone Camera' below
                </p>
                {cameraError && (
                  <p className="text-[11px] text-rose-400 bg-rose-950/40 px-2.5 py-1 rounded-lg mt-1 border border-rose-800">
                    {cameraError}
                  </p>
                )}
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {!selfieUrl && !cameraStarted && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={startCamera}
                  size="sm"
                  disabled={compressing}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Video className="h-3.5 w-3.5 mr-1.5" /> Start Live Camera
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={compressing}
                  onClick={() => cameraInputRef.current?.click()}
                  className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                >
                  <Camera className="h-3.5 w-3.5 mr-1.5" /> Open Phone Camera
                </Button>
              </div>
            )}

            {cameraStarted && !selfieUrl && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={takeSelfie}
                  loading={compressing}
                  size="sm"
                >
                  <Camera className="h-3.5 w-3.5 mr-1.5" /> Capture Selfie Now
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={stopCamera}>
                  Stop
                </Button>
              </div>
            )}

            {selfieUrl && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  size="sm"
                  disabled={compressing}
                  onClick={() => {
                    setSelfieUrl(null);
                    startCamera();
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retake Selfie
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={compressing}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> Choose File
                </Button>
              </div>
            )}

            {/* Hidden native camera/file inputs with auto-compression */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
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

          {/* GPS Location Info */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex items-start gap-3">
            <MapPin className={`h-4 w-4 mt-0.5 flex-shrink-0 ${location ? "text-emerald-600" : "text-slate-400"}`} />
            <div className="flex-1 min-w-0">
              {location ? (
                <>
                  <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> GPS Location Captured
                  </p>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">{location.name}</p>
                  <a
                    href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-indigo-600 underline font-medium hover:text-indigo-800"
                  >
                    View on Google Maps
                  </a>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium text-slate-600">Detecting Location...</p>
                  <p className="text-[10px] text-slate-400">GPS coordinates will be attached automatically</p>
                </>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              loading={loadingGPS}
              onClick={getLocation}
              className="text-[11px] px-2.5 py-1 h-auto flex-shrink-0"
            >
              {location ? "Refresh" : "Get GPS"}
            </Button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 pt-0 flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => {
              stopCamera();
              onCancel();
            }}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleConfirm}
            size="sm"
            disabled={!selfieUrl || compressing}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Confirm & Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
