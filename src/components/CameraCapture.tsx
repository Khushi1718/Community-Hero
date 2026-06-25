"use client";

import React, { useRef, useState, useEffect } from "react";
import { Camera, Image as ImageIcon, X, RefreshCw, Check, MapPin } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (
    base64: string,
    metadata: {
      latitude?: number;
      longitude?: number;
      timestamp: number;
      deviceInfo: string;
      cameraSource: "Level 1 (In-App)" | "Level 2 (Gallery Upload)";
    }
  ) => void;
  onCancel: () => void;
  isEmployee?: boolean;
  officialOnly?: boolean;
}

export function CameraCapture({ onCapture, onCancel, isEmployee = false, officialOnly = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [locating, setLocating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameraSource, setCameraSource] = useState<"Level 1 (In-App)" | "Level 2 (Gallery Upload)">("Level 1 (In-App)");

  useEffect(() => {
    startCamera();
    getLocation();
    return () => stopCamera();
  }, [facingMode]);

  const getLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            acc: pos.coords.accuracy
          });
          setLocating(false);
        },
        (err) => {
          console.warn("Location error:", err);
          setError("Failed to get location. GPS is required for verification.");
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocating(false);
    }
  };

  const startCamera = async () => {
    stopCamera();
    setError(null);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setError("Failed to access camera. Please allow camera permissions or use gallery upload.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const drawWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number, timestamp: Date) => {
    // Watermark removed as per request
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const timestamp = new Date();
    drawWatermark(ctx, canvas.width, canvas.height, timestamp);
    
    // Compress and get base64
    const base64 = canvas.toDataURL("image/jpeg", 0.7);
    setCapturedImage(base64);
    setCameraSource("Level 1 (In-App)");
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Resize if too large
        const MAX_WIDTH = 1920;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const timestamp = new Date();
        drawWatermark(ctx, width, height, timestamp);

        const base64 = canvas.toDataURL("image/jpeg", 0.7);
        setCapturedImage(base64);
        setCameraSource("Level 2 (Gallery Upload)");
        stopCamera();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const confirmCapture = () => {
    if (!capturedImage) return;
    onCapture(capturedImage, {
      latitude: location?.lat,
      longitude: location?.lng,
      timestamp: Date.now(),
      deviceInfo: navigator.userAgent,
      cameraSource
    });
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={() => { stopCamera(); onCancel(); }} className="p-2 text-white bg-black/50 rounded-full hover:bg-black/70">
          <X className="w-6 h-6" />
        </button>
        {locating ? (
          <span className="text-white text-sm flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            Locating...
          </span>
        ) : location ? (
          <span className="text-white text-sm flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full text-green-400">
            <MapPin className="w-4 h-4" /> GPS Locked
          </span>
        ) : (
          <span className="text-white text-sm flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full text-red-400">
            <MapPin className="w-4 h-4" /> GPS Disabled
          </span>
        )}
      </div>

      {/* Main View */}
      <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-white">
            <p className="text-red-400 mb-4">{error}</p>
          </div>
        ) : capturedImage ? (
          <img src={capturedImage} alt="Captured" className="max-h-full max-w-full object-contain" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-center gap-10 pb-safe">
        {capturedImage ? (
          <>
            <button onClick={retakePhoto} className="flex flex-col items-center gap-2 text-white">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <RefreshCw className="w-6 h-6" />
              </div>
              <span className="text-xs">Retake</span>
            </button>
            <button onClick={confirmCapture} className="flex flex-col items-center gap-2 text-white">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                <Check className="w-10 h-10" />
              </div>
              <span className="text-xs font-bold">Use Photo</span>
            </button>
          </>
        ) : (
          <>
            {/* Gallery Upload (Level 2) - Hidden if officialOnly */}
            {!officialOnly && (
              <label className="flex flex-col items-center gap-2 text-white cursor-pointer">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <span className="text-xs">Gallery</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            )}

            {/* Shutter (Level 1) */}
            <button onClick={capturePhoto} className="flex flex-col items-center gap-2 text-white">
              <div className="w-20 h-20 rounded-full border-4 border-white/50 flex items-center justify-center active:scale-95 transition-transform">
                <div className="w-16 h-16 rounded-full bg-white" />
              </div>
              <span className="text-xs font-bold">Capture</span>
            </button>

            {/* Switch Camera */}
            <button onClick={switchCamera} className="flex flex-col items-center gap-2 text-white">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <RefreshCw className="w-6 h-6" />
              </div>
              <span className="text-xs">Flip</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
