"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Camera, Video, X, RefreshCw, Check, MapPin, Mic, AlertTriangle,
  Zap, ZapOff, Info, Navigation2
} from "lucide-react";

export interface CaptureMetadata {
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
  locationName?: string;
  timestamp: number;
  deviceInfo: string;
  browserInfo: string;
  captureType: "photo" | "video";
  cameraSource: "Level 1 (In-App)" | "Level 2 (Gallery Upload)";
}

interface EvidenceCaptureProps {
  // mediaBase64 is always the base64 representation of the captured media.
  // blob is additionally provided for video captures so the parent can use
  // URL.createObjectURL() for reliable frame extraction.
  onCapture: (mediaBase64: string, metadata: CaptureMetadata, blob?: Blob) => void;
  onCancel: () => void;
  officialOnly?: boolean;
}

type CaptureMode = "photo" | "video";
type RecordingState = "idle" | "countdown" | "recording" | "stopping";

const MIN_VIDEO_SECONDS = 5;
const MAX_VIDEO_SECONDS = 20;

// Reverse-geocode using OpenStreetMap Nominatim
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&accept-language=en`,
      { headers: { "User-Agent": "CommunityHero/1.0" } }
    );
    const data = await res.json();
    const a = data.address;
    const parts = [
      a.suburb || a.neighbourhood || a.village || a.hamlet,
      a.city || a.town || a.county || a.state_district,
      a.state,
    ].filter(Boolean);
    return parts.slice(0, 3).join(", ");
  } catch {
    return "";
  }
}

export function EvidenceCapture({ onCapture, onCancel, officialOnly = false }: EvidenceCaptureProps) {
  const [mode, setMode] = useState<CaptureMode>("photo");
  const [initialized, setInitialized] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  // Photo
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Video
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [countdownNum, setCountdownNum] = useState(3);
  const [capturedVideoUrl, setCapturedVideoUrl] = useState<string | null>(null);
  const [capturedVideoBlob, setCapturedVideoBlob] = useState<Blob | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // GPS
  const [gps, setGps] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [locating, setLocating] = useState(true);

  // UI
  const [error, setError] = useState<string | null>(null);
  const [feedbackTip, setFeedbackTip] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);

  // GPS ─────────────────────────────────────────────────────────────────────
  const fetchGPS = useCallback(() => {
    setLocating(true);
    if (!("geolocation" in navigator)) { setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy };
        setGps(coords);
        setLocating(false);
        const name = await reverseGeocode(coords.lat, coords.lng);
        setLocationName(name);
      },
      () => { setLocating(false); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  // Camera ──────────────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  }, [stream]);

  const startCamera = useCallback(async (captureMode: CaptureMode, facing: "environment" | "user" = facingMode) => {
    stopStream();
    setError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: captureMode === "video",
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = newStream;
      }, 50);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
      } else {
        setError("Could not access camera. Please check your device.");
      }
    }
  }, [facingMode, stopStream]);

  // Init on mount
  useEffect(() => {
    fetchGPS();
    startCamera("photo");
    setInitialized(true);
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch mode
  const switchMode = (newMode: CaptureMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setCapturedImage(null);
    setCapturedVideoUrl(null);
    setCapturedVideoBlob(null);
    setRecordingState("idle");
    setRecordingSeconds(0);
    setFeedbackTip(null);
    startCamera(newMode);
  };

  // Flip camera
  const flipCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(mode, next);
  };

  // Torch
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn(t => !t);
    } catch { /* torch not supported */ }
  };

  // Watermark
  const drawWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const ts = new Date();
    const dateStr = ts.toLocaleString("en-IN", { hour12: true });
    const gpsStr = gps ? `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}` : "GPS: N/A";
    const accStr = gps ? `±${Math.round(gps.acc)}m accuracy` : "";
    const cityStr = locationName || "";

    const lineH = Math.max(13, Math.round(h * 0.018));
    const pad = 12;
    const lines = ["✔ Community Hero — Official Evidence", dateStr, cityStr, gpsStr, accStr].filter(Boolean);
    const boxH = lines.length * lineH + pad * 2;
    const boxW = Math.round(w * 0.58);
    const boxX = pad;
    const boxY = h - pad - boxH;

    ctx.fillStyle = "rgba(0,0,0,0.60)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    else ctx.rect(boxX, boxY, boxW, boxH);
    ctx.fill();

    lines.forEach((line, i) => {
      ctx.font = i === 0
        ? `bold ${lineH + 1}px -apple-system,sans-serif`
        : `${lineH}px -apple-system,sans-serif`;
      ctx.fillStyle = i === 0 ? "#22c55e" : "#ffffff";
      ctx.fillText(line, boxX + pad, boxY + pad + lineH * (i + 1) - 2);
    });
  };

  // Capture Photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    drawWatermark(ctx, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(base64);
    stopStream();
    analyzeBrightness(base64);
  };

  // Brightness check for feedback
  const analyzeBrightness = (base64: string) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 64; c.height = 64;
      const cx = c.getContext("2d");
      if (!cx) return;
      cx.drawImage(img, 0, 0, 64, 64);
      const data = cx.getImageData(0, 0, 64, 64).data;
      let brightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        brightness += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      brightness /= (64 * 64);
      if (brightness < 35) setFeedbackTip("Lighting is too dark — please move to a brighter area or use flash.");
      else if (brightness > 230) setFeedbackTip("Image is overexposed — try capturing from the shade.");
      else setFeedbackTip(null);
    };
    img.src = base64;
  };

  // Video recording
  const startRecording = () => {
    if (!stream) return;
    recordedChunksRef.current = [];
    let c = 3;
    setCountdownNum(c);
    setRecordingState("countdown");
    const ci = setInterval(() => {
      c--;
      setCountdownNum(c);
      if (c <= 0) { clearInterval(ci); beginRecording(); }
    }, 1000);
  };

  const beginRecording = () => {
    if (!stream) return;
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "video/mp4";

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2000000 });
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = e => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      setCapturedVideoBlob(blob);
      setCapturedVideoUrl(URL.createObjectURL(blob));
      setRecordingSeconds(0);
      stopStream();
    };

    recorder.start(100);
    setRecordingState("recording");
    setRecordingSeconds(0);
    let secs = 0;
    recordingTimerRef.current = setInterval(() => {
      secs++;
      setRecordingSeconds(secs);
      if (secs >= MAX_VIDEO_SECONDS) stopRecording();
    }, 1000);
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current?.state !== "inactive") {
      setRecordingState("stopping");
      mediaRecorderRef.current?.stop();
    }
  };

  // Retake
  const retake = () => {
    setCapturedImage(null);
    setCapturedVideoUrl(null);
    setCapturedVideoBlob(null);
    setFeedbackTip(null);
    setRecordingState("idle");
    setRecordingSeconds(0);
    startCamera(mode);
  };

  // Confirm capture — pass blob alongside base64 so the parent can choose
  // the most efficient extraction path (objectURL for videos).
  const confirmCapture = () => {
    const meta: CaptureMetadata = {
      latitude: gps?.lat,
      longitude: gps?.lng,
      gpsAccuracy: gps?.acc,
      locationName,
      timestamp: Date.now(),
      deviceInfo: navigator.userAgent,
      browserInfo: navigator.userAgent,
      captureType: mode,
      cameraSource: "Level 1 (In-App)",
    };

    if (mode === "photo" && capturedImage) {
      onCapture(capturedImage, meta);
    } else if (mode === "video" && capturedVideoBlob) {
      // For video: convert to base64 for storage/watermark display,
      // but also pass the raw Blob so the parent can use objectURL for frame extraction.
      const reader = new FileReader();
      reader.onloadend = () => {
        onCapture(reader.result as string, { ...meta, captureType: "video" }, capturedVideoBlob);
      };
      reader.readAsDataURL(capturedVideoBlob);
    }
  };

  // Whether we're showing preview
  const isPreview = !!(capturedImage || capturedVideoUrl);
  const hasMedia = isPreview;

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[1001] bg-black flex flex-col select-none">

      {/* ── TOP CHROME ─────────────────────────────────────────────────────── */}
      <div className="relative flex items-center justify-between px-4 pt-safe pt-3 pb-3 bg-black z-20">
        {/* Close */}
        <button
          onClick={() => { stopStream(); onCancel(); }}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* GPS Pill — center */}
        <div className="flex-1 flex justify-center px-2">
          {locating ? (
            <div className="inline-flex items-center gap-1.5 bg-white/10 text-white/70 text-xs px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Locating…
            </div>
          ) : gps ? (
            <div className="inline-flex flex-col items-center gap-0.5">
              <div className="inline-flex items-center gap-1.5 bg-emerald-900/80 text-emerald-300 text-xs px-3 py-1 rounded-full">
                <Navigation2 className="w-3 h-3" />
                <span className="font-bold">GPS locked · ±{Math.round(gps.acc)}m</span>
              </div>
              {locationName && (
                <span className="text-white/60 text-[10px] text-center leading-none max-w-[180px] truncate">{locationName}</span>
              )}
              <span className="text-white/40 text-[9px] font-mono">{gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 bg-red-900/60 text-red-300 text-xs px-3 py-1.5 rounded-full">
              <MapPin className="w-3 h-3" />
              <span>GPS unavailable</span>
            </div>
          )}
        </div>

        {/* Torch / spacer */}
        <button
          onClick={toggleTorch}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${torchOn ? "bg-yellow-400/20 text-yellow-400" : "bg-white/10 text-white"}`}
        >
          {torchOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
        </button>
      </div>

      {/* ── VIEWFINDER ─────────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400" />
            <p className="text-red-300 font-semibold text-sm">{error}</p>
            <button onClick={() => startCamera(mode)} className="px-5 py-2.5 bg-white/15 text-white rounded-xl text-sm font-medium">
              Try Again
            </button>
          </div>
        ) : isPreview ? (
          mode === "photo" && capturedImage ? (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
          ) : capturedVideoUrl ? (
            <video ref={previewVideoRef} src={capturedVideoUrl} controls playsInline className="w-full h-full object-contain" />
          ) : null
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

            {/* Countdown overlay */}
            {recordingState === "countdown" && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-black leading-none" style={{ fontSize: "28vw" }}>
                  {countdownNum || ""}
                </span>
              </div>
            )}

            {/* Recording progress bar */}
            {recordingState === "recording" && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
                <div
                  className="h-full bg-red-500 transition-all duration-1000"
                  style={{ width: `${(recordingSeconds / MAX_VIDEO_SECONDS) * 100}%` }}
                />
              </div>
            )}

            {/* Viewfinder guide corners */}
            {!isPreview && recordingState === "idle" && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[18%] left-[8%] w-8 h-8 border-t-2 border-l-2 border-white/40 rounded-tl-lg" />
                <div className="absolute top-[18%] right-[8%] w-8 h-8 border-t-2 border-r-2 border-white/40 rounded-tr-lg" />
                <div className="absolute bottom-[18%] left-[8%] w-8 h-8 border-b-2 border-l-2 border-white/40 rounded-bl-lg" />
                <div className="absolute bottom-[18%] right-[8%] w-8 h-8 border-b-2 border-r-2 border-white/40 rounded-br-lg" />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── FEEDBACK TIP ───────────────────────────────────────────────────── */}
      {feedbackTip && (
        <div className="px-4 py-2 bg-amber-900/80 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-200 text-xs">{feedbackTip}</p>
        </div>
      )}

      {/* ── BOTTOM CHROME ──────────────────────────────────────────────────── */}
      <div className="bg-black pb-safe pb-6 pt-4 px-6">

        {isPreview ? (
          /* Preview actions */
          <div className="flex items-center justify-center gap-16">
            <button onClick={retake} className="flex flex-col items-center gap-1.5 text-white">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                <RefreshCw className="w-6 h-6" />
              </div>
              <span className="text-xs text-white/70">Retake</span>
            </button>

            <button onClick={confirmCapture} className="flex flex-col items-center gap-1.5 text-white">
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.6)]">
                <Check className="w-10 h-10 text-white" />
              </div>
              <span className="text-xs font-bold text-white">{mode === "photo" ? "Use Photo" : "Use Video"}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Mode Tabs — like a real mobile camera */}
            <div className="flex justify-center">
              <div className="flex gap-0 bg-white/10 rounded-full p-1">
                <button
                  onClick={() => switchMode("photo")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${
                    mode === "photo"
                      ? "bg-white text-black shadow"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <Camera className="w-4 h-4" /> Photo
                </button>
                <button
                  onClick={() => switchMode("video")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${
                    mode === "video"
                      ? "bg-white text-black shadow"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <Video className="w-4 h-4" /> Video
                </button>
              </div>
            </div>

            {/* Shutter / Record row */}
            <div className="flex items-center justify-center gap-10">
              {/* Flip Camera */}
              <button onClick={flipCamera} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                <RefreshCw className="w-5 h-5" />
              </button>

              {/* Main shutter */}
              {mode === "photo" ? (
                <button
                  onClick={capturePhoto}
                  disabled={!!error}
                  className="w-20 h-20 rounded-full border-[4px] border-white/70 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
                >
                  <div className="w-[68px] h-[68px] rounded-full bg-white" />
                </button>
              ) : recordingState === "idle" ? (
                <button
                  onClick={startRecording}
                  disabled={!!error}
                  className="w-20 h-20 rounded-full border-[4px] border-white/70 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
                >
                  <div className="w-14 h-14 rounded-full bg-red-500" />
                </button>
              ) : recordingState === "recording" ? (
                <button
                  onClick={stopRecording}
                  disabled={recordingSeconds < MIN_VIDEO_SECONDS}
                  className="w-20 h-20 rounded-full border-[4px] border-red-500 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40 relative"
                >
                  {/* Square stop button */}
                  <div className="w-8 h-8 bg-red-500 rounded-md" />
                  {/* Timer ring */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="4" />
                    <circle
                      cx="40" cy="40" r="36" fill="none" stroke="rgb(239,68,68)" strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - recordingSeconds / MAX_VIDEO_SECONDS)}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                </button>
              ) : (
                <div className="w-20 h-20 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}

              {/* Recording seconds display (right) */}
              <div className="w-12 flex flex-col items-center gap-1 text-white/70">
                {recordingState === "recording" && (
                  <>
                    <span className="text-red-400 font-mono font-bold text-lg leading-none">{recordingSeconds}</span>
                    <span className="text-[9px] text-white/50">/ {MAX_VIDEO_SECONDS}s</span>
                  </>
                )}
              </div>
            </div>

            {/* Video hint text */}
            {mode === "video" && recordingState === "idle" && (
              <p className="text-center text-white/40 text-xs">Hold steady · Record {MIN_VIDEO_SECONDS}–{MAX_VIDEO_SECONDS}s for best AI accuracy</p>
            )}
            {mode === "video" && recordingState === "recording" && recordingSeconds < MIN_VIDEO_SECONDS && (
              <p className="text-center text-white/60 text-xs animate-pulse">Keep recording… ({MIN_VIDEO_SECONDS - recordingSeconds}s more needed)</p>
            )}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
