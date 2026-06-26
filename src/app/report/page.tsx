"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Camera, MapPin, CheckCircle2, Sparkles, AlertTriangle, ShieldCheck, Clock, XCircle, Send, AlertOctagon, Video, Film, BarChart2, Zap, Info } from "lucide-react";
import { saveIssue, getIssues, Issue } from "@/lib/storage";
import { EvidenceCapture, CaptureMetadata } from "@/components/EvidenceCapture";

interface AIAnalysis {
  category: string;
  severity: string;
  reasoningPoints: string[];
  department: string;
  confidence?: number;
  userFeedback?: string[];
  // Video-specific
  issueType?: string;
  visibleFrames?: number;
  totalFrames?: number;
  summary?: string;
  recommendation?: string;
  trust: {
    status: string;
    verificationScore?: number;
    checks: {
      hasGPS: boolean;
      isFresh: boolean;
      confidenceScore: number;
      spamScore?: number;
      consistencyScore?: number;
    }
  }
}

// Feature 10: Haversine distance formula
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in meters
}

function parseLocation(loc: string) {
  const parts = loc.split(",");
  if (parts.length === 2) {
    return { lat: parseFloat(parts[0]), lon: parseFloat(parts[1]) };
  }
  return null;
}

export default function ReportPage() {
  const { user, role, loading, logoutMock } = useAuth();
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [stateName, setStateName] = useState("");
  const [cityName, setCityName] = useState("");
  const [address, setAddress] = useState("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [captureType, setCaptureType] = useState<"photo" | "video">("photo");
  // Keep the raw video blob separately so we can extract frames via object URL (more reliable than base64 data URL)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [captureMetadata, setCaptureMetadata] = useState<CaptureMetadata | null>(null);
  const [showCapture, setShowCapture] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState("");
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; acc?: number } | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRejected, setIsRejected] = useState(false); // For Non-Civic Issues
  const [assignmentStatus, setAssignmentStatus] = useState<"finding" | "assigned">("finding");
  
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  
  // Review AI state
  const [isReviewing, setIsReviewing] = useState(false);
  const [draftIssue, setDraftIssue] = useState<Issue | null>(null);
  const [manualCategory, setManualCategory] = useState("");
  const [manualDepartment, setManualDepartment] = useState("");

  const CATEGORIES = [
    "Pothole", "Road Damage", "Water Leakage", "Waterlogging", 
    "Garbage Dump", "Overflowing Dustbin", "Broken Streetlight", 
    "Damaged Footpath", "Open Manhole", "Sewage Overflow", 
    "Blocked Drain", "Traffic Signal Damage", "Fallen Tree", 
    "Stray Animal", "Park Maintenance Issue", "Broken Public Property", 
    "Electrical Hazard", "Illegal Dumping", "Encroachment", 
    "Public Toilet Issue", "No Significant Civic Issue", "Unverified - AI Unavailable", "Other"
  ];
  
  const DEPARTMENTS = [
    "Roads Department", "Electricity Department", "Water Department", 
    "Municipal Committee", "Animal Control", "Traffic Police", 
    "Parks Department", "Miscellaneous"
  ];

  // Duplicate Override State
  const [duplicateWarningId, setDuplicateWarningId] = useState<string | null>(null);
  const [pendingIssue, setPendingIssue] = useState<Issue | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (role !== "citizen") {
        router.push("/");
      } else {
        // Init state if needed
      }
    }
  }, [user, role, loading, router]);

  // Removed loadMyIssues as myIssues is now in a separate page

  const handleCapture = (base64: string, meta: CaptureMetadata, blob?: Blob) => {
    // Just store the captured media — do NOT run analysis yet.
    // Analysis runs only when the user clicks Submit after filling in all fields.
    setImageBase64(base64);
    setCaptureType(meta.captureType);
    setCaptureMetadata(meta);
    setDeviceInfo(meta.deviceInfo);
    setTimestamp(meta.timestamp);
    if (meta.latitude && meta.longitude) {
      setLocation(`${meta.latitude},${meta.longitude}`);
      setGpsCoords({ lat: meta.latitude, lng: meta.longitude, acc: meta.gpsAccuracy });
    }
    // For video: store the Blob so we can extract frames via objectURL at submit time
    if (meta.captureType === "video" && blob) {
      setVideoBlob(blob);
    } else {
      setVideoBlob(null);
    }
    setShowCapture(false);
    setAiAnalysis(null); // reset any previous analysis
    setIsRejected(false);
  };

  // ── Extract frames from a Blob using an object URL ───────────────────────
  // Using object URL is far more reliable than a base64 data URL for video:
  // browsers can stream it and reliably fire loadedmetadata with a valid duration.
  const extractVideoFrames = (blob: Blob): Promise<string[]> => {
    return new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(blob);
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const frames: string[] = [];

      const cleanup = () => URL.revokeObjectURL(objectUrl);

      video.onloadedmetadata = () => {
        const duration = video.duration;
        console.log(`[Frame Extractor] Video duration: ${duration}s, ${video.videoWidth}x${video.videoHeight}`);

        canvas.width = Math.min(video.videoWidth || 1280, 640);
        canvas.height = Math.min(video.videoHeight || 720, 360);

        if (!duration || !isFinite(duration) || duration <= 0) {
          console.warn("[Frame Extractor] Invalid duration — capturing single frame at t=0");
          video.currentTime = 0;
          const fallbackSeek = () => {
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              frames.push(canvas.toDataURL("image/jpeg", 0.8));
            }
            cleanup();
            resolve(frames);
          };
          video.onseeked = fallbackSeek;
          return;
        }

        // 1 frame per second, capped at 10 frames
        const maxFrames = Math.min(Math.ceil(duration), 10);
        const times: number[] = [];
        for (let i = 0; i < maxFrames; i++) {
          // spread evenly across the video, avoid the very last frame
          times.push(Math.min((i / maxFrames) * duration, duration - 0.05));
        }

        console.log(`[Frame Extractor] Will extract ${times.length} frames at: ${times.map(t => t.toFixed(1)).join("s, ")}s`);

        const captureFrame = (index: number) => {
          if (index >= times.length) {
            console.log(`[Frame Extractor] Done — ${frames.length} frames extracted`);
            cleanup();
            resolve(frames);
            return;
          }
          video.currentTime = times[index];
        };

        video.onseeked = () => {
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            frames.push(canvas.toDataURL("image/jpeg", 0.8));
          }
          captureFrame(frames.length);
        };

        captureFrame(0);
      };

      video.onerror = (e) => {
        console.error("[Frame Extractor] Video error:", e);
        cleanup();
        resolve(frames);
      };

      // Timeout fallback: if metadata never loads in 10s, resolve with whatever we have
      const timeout = setTimeout(() => {
        console.warn("[Frame Extractor] Timeout — resolving with", frames.length, "frames");
        cleanup();
        resolve(frames);
      }, 10000);

      video.addEventListener("loadedmetadata", () => clearTimeout(timeout), { once: true });

      video.preload = "auto";
      video.muted = true;
      video.src = objectUrl;
      video.load();
    });
  };

  const buildIssue = (mediaBase64: string, data: AIAnalysis, meta: CaptureMetadata): Issue => {
    const ts = meta.timestamp;
    return {
      id: "ISSUE-" + Math.floor(Math.random() * 1000000),
      citizenEmail: user!.email,
      imageBase64: mediaBase64,
      description,
      location,
      state: stateName,
      city: cityName,
      address,
      timestamp: ts,
      aiAnalysis: data,
      deviceInfo: meta.deviceInfo,
      browserInfo: navigator.userAgent,
      status: "Open",
      cameraSource: meta.cameraSource,
      timeline: [
        { event: "Report Submitted", timestamp: ts },
        { event: `AI ${meta.captureType === "video" ? "Video" : "Vision"} Analysis Complete`, timestamp: ts + 100 }
      ]
    };
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageBase64 || !description || !stateName || !cityName || !address) return;
    if (!location) {
      alert("GPS location is required to prevent false reports. Please enable GPS and retake the photo/video.");
      return;
    }

    setIsSubmitting(true);
    setDuplicateWarningId(null);
    setIsRejected(false);

    const meta: CaptureMetadata = captureMetadata || {
      latitude: gpsCoords?.lat,
      longitude: gpsCoords?.lng,
      gpsAccuracy: gpsCoords?.acc,
      timestamp,
      deviceInfo,
      browserInfo: navigator.userAgent,
      captureType,
      cameraSource: "Level 1 (In-App)",
    };

    try {
      // ── VIDEO PATH ────────────────────────────────────────────────────────
      if (captureType === "video" && videoBlob) {
        console.log("[Submit] Video path — extracting frames from Blob...");
        const frames = await extractVideoFrames(videoBlob);
        console.log(`[Submit] Extracted ${frames.length} frames. Sending to /api/analyze-video`);

        if (frames.length === 0) {
          alert("Could not extract frames from the video. Please retake the video and try again.");
          setIsSubmitting(false);
          return;
        }

        const res = await fetch("/api/analyze-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frames,
            description,
            latitude: meta.latitude,
            longitude: meta.longitude,
            timestamp: meta.timestamp,
            cameraSource: meta.cameraSource,
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const normalized: AIAnalysis = {
          ...data,
          category: data.issueType || data.category || "No Significant Civic Issue",
          reasoningPoints: [
            data.summary || "Video analysis complete.",
            `Issue detected in ${data.visibleFrames ?? "?"}/${data.totalFrames ?? "?"} frames.`,
            data.recommendation || "",
          ].filter(Boolean),
          department: data.department || "Miscellaneous",
        };

        setAiAnalysis(normalized);

        if (normalized.category === "No Significant Civic Issue" || (normalized.trust?.checks?.spamScore && normalized.trust.checks.spamScore > 70)) {
          setIsRejected(true);
          setIsSubmitting(false);
          return;
        }

        const newIssue = buildIssue(imageBase64, normalized, meta);
        setManualCategory(normalized.category);
        setManualDepartment(normalized.department);
        setDraftIssue(newIssue);
        setIsReviewing(true);
        setIsSubmitting(false);
        return;
      }

      // ── PHOTO PATH ────────────────────────────────────────────────────────
      console.log("[Submit] Photo path — sending to /api/analyze...");
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          description,
          latitude: meta.latitude,
          longitude: meta.longitude,
          location,
          timestamp,
          cameraSource: meta.cameraSource || "Level 1 (In-App)"
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data: AIAnalysis = await res.json();
      setAiAnalysis(data);

      if (data.category === "No Significant Civic Issue" || data.category === "Non-Civic Issue" || (data.trust?.checks?.spamScore && data.trust.checks.spamScore > 70)) {
        setIsRejected(true);
        setIsSubmitting(false);
        return;
      }

      const newIssue = buildIssue(imageBase64, data, meta);
      setManualCategory(data.category);
      setManualDepartment(data.department);
      setDraftIssue(newIssue);
      setIsReviewing(true);
      setIsSubmitting(false);

    } catch (error: any) {
      console.error("[Submit] Analysis failed:", error);
      alert(`Analysis failed: ${error.message || "Unknown error"}. Please check your connection and try again.`);
      setIsSubmitting(false);
    }
  };


  const handleConfirmSubmit = async () => {
    if (!draftIssue || !aiAnalysis) return;

    setIsReviewing(false);
    setIsSubmitting(true);
    
    // Apply manual overrides
    const finalData = {
      ...aiAnalysis,
      category: manualCategory,
      department: manualDepartment
    };

    const finalIssue = {
      ...draftIssue,
      aiAnalysis: finalData,
      timeline: [
        ...draftIssue.timeline,
        { event: `User Confirmed Category: ${manualCategory}`, timestamp: Date.now() },
        { event: `Routed to ${manualDepartment}`, timestamp: Date.now() + 100 }
      ]
    };

    // Duplicate Detection Logic via Server (Prompt 4B Enhancement)
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalIssue)
      });

      if (res.status === 409) {
        // Backend detected duplicate via $nearSphere
        const errData = await res.json();
        if (errData.isDuplicate) {
          setDuplicateWarningId(errData.duplicateWarningId);
          setPendingIssue(finalIssue);
          setIsSubmitting(false);
          return; // Pause for override confirmation
        }
      }

      if (!res.ok) {
        throw new Error(`Failed to submit issue: ${res.status}`);
      }

      const savedIssue = await res.json();
      setDraftIssue(savedIssue);
      setSuccess(true);
      setTimeout(() => setAssignmentStatus("assigned"), 2500); // Simulate finding
      
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit issue. Please try again.");
    }

    setIsSubmitting(false);
  };

  const confirmDuplicate = async () => {
    if (!pendingIssue || !duplicateWarningId) return;
    setIsSubmitting(true);
    
    const finalIssue = {
      ...pendingIssue,
      isDuplicateOf: duplicateWarningId,
      duplicateStatus: "Pending" as const
    };

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalIssue)
      });
      if (res.ok) {
        const savedIssue = await res.json();
        setDraftIssue(savedIssue);
        setDuplicateWarningId(null);
        setPendingIssue(null);
        setSuccess(true);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to confirm duplicate. Please try again.");
    }
    setIsSubmitting(false);
  };

  const overrideDuplicate = async () => {
    if (!pendingIssue || !duplicateWarningId) return;
    setIsSubmitting(true);
    
    const finalIssue = {
      ...pendingIssue,
      isDuplicateOf: duplicateWarningId,
      duplicateStatus: "Overridden" as const
    };

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalIssue)
      });
      if (res.ok) {
        const savedIssue = await res.json();
        setDraftIssue(savedIssue);
        setDuplicateWarningId(null);
        setPendingIssue(null);
        setSuccess(true);
        setTimeout(() => setAssignmentStatus("assigned"), 2500);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to override. Please try again.");
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setSuccess(false);
    setAssignmentStatus("finding");
    setIsRejected(false);
    setIsReviewing(false);
    setDescription("");
    setLocation("");
    setStateName("");
    setCityName("");
    setAddress("");
    setImageBase64("");
    setGpsCoords(null);
    setAiAnalysis(null);
    setDuplicateWarningId(null);
    setPendingIssue(null);
    setDraftIssue(null);
  };

  if (loading || !user || role !== "citizen") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-8">


      <main className="max-w-2xl mx-auto">
        
        {/* State: AI Reject (Spam/Non-Civic) */}
        {isRejected && aiAnalysis ? (
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-lg animate-fade-in-up mb-12">
            <div className="text-center mb-8 border-b border-slate-100 pb-8">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Submission Rejected</h2>
              <p className="text-slate-600">Our AI detected that this is likely a non-civic issue or spam.</p>
            </div>
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 mb-8">
              <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Agent Reasoning
              </h3>
              <ul className="space-y-2 text-red-700 text-sm">
                {aiAnalysis.reasoningPoints.map((p, i) => (
                  <li key={i} className="flex gap-2"><span className="mt-1">•</span>{p}</li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-red-200 flex justify-between items-center">
                <span className="text-sm font-bold text-red-800 uppercase tracking-wide">Trust Engine Score</span>
                <span className="font-bold text-red-600">{aiAnalysis.trust.checks.spamScore}% Spam Likelihood</span>
              </div>
            </div>
            <button onClick={resetForm} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-4 rounded-xl transition-colors">
              Try Again with a Different Image
            </button>
          </div>
        ) : 

        /* State: Review AI Prediction */
        isReviewing && aiAnalysis && draftIssue ? (
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-xl mb-12 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" /> Review AI Prediction
            </h2>
            
            {aiAnalysis.trust.checks.confidenceScore < 70 && (
              <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 font-medium">The AI has low confidence ({aiAnalysis.trust.checks.confidenceScore}%) in this prediction. Please carefully verify and correct the category if needed.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <img src={draftIssue.imageBase64} alt="Reported issue" className="w-full h-48 object-cover rounded-xl border border-slate-200 mb-4" />
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">AI Reasoning</p>
                  <ul className="space-y-1 text-sm text-slate-700">
                    {aiAnalysis.reasoningPoints?.map((p, i) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-indigo-400 shrink-0">•</span> <span className="break-words min-w-0 flex-1">{p}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Predicted Category</label>
                  <select 
                    value={manualCategory}
                    onChange={e => setManualCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Route to Department</label>
                  <select 
                    value={manualDepartment}
                    onChange={e => setManualDepartment(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">AI Confidence:</span>
                  <span className={`text-lg font-black ${aiAnalysis.trust.checks.confidenceScore >= 80 ? 'text-green-600' : aiAnalysis.trust.checks.confidenceScore >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{aiAnalysis.trust.checks.confidenceScore}%</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={resetForm} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirmSubmit} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Confirm & Submit
              </button>
            </div>
          </div>
        ) : 

        /* State: Duplicate Pending Override */
        duplicateWarningId && pendingIssue ? (
          <div className="bg-white border border-orange-200 rounded-[2rem] p-8 shadow-xl animate-fade-in-up mb-12 ring-4 ring-orange-50">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertOctagon className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Possible Duplicate Detected</h2>
              <p className="text-slate-600 mt-2">
                A similar <strong>{aiAnalysis?.category}</strong> was reported near your location within the last 30 days (Issue ID: {duplicateWarningId}).
              </p>
            </div>
            
            <div className="bg-orange-50 p-6 rounded-2xl mb-8 flex items-start gap-4">
               <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0" />
               <p className="text-orange-800 text-sm leading-relaxed">
                 To save municipal resources, we group duplicates together. If this is the exact same issue, please confirm it. If this is a completely different issue that just happens to be nearby, you can override this warning.
               </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={confirmDuplicate}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> Yes, Group as Duplicate
              </button>
              <button 
                onClick={overrideDuplicate}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2"
              >
                No, This is Different
              </button>
            </div>
          </div>
        ) : 

        /* State: Success */
        success && aiAnalysis && draftIssue ? (
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-fade-in-up mb-12">
            <div className="text-center mb-8 border-b border-slate-100 pb-8 relative">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Issue Successfully Reported</h2>
              <div className="inline-block bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold px-4 py-2 rounded-lg mb-6 shadow-sm text-lg tracking-wider">
                {draftIssue.id}
              </div>
              
              {/* Feature 2: Auto Assignment Experience */}
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left relative overflow-hidden transition-all">
                {assignmentStatus === "finding" ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-indigo-700 font-bold animate-pulse">Finding Responsible Department...</p>
                    <p className="text-sm text-slate-500 mt-2">AI is matching priority and jurisdiction.</p>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Send className="w-5 h-5 text-indigo-600" />
                        Current Status: {draftIssue.assignedTo ? "Assigned" : "Unassigned"}
                      </h3>
                      <span className="bg-red-100 text-red-700 font-black text-xs uppercase px-3 py-1 rounded-full border border-red-200">
                        {aiAnalysis.severity} Priority
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                      <div>
                        <p className="text-slate-500 font-medium">Assigned Department</p>
                        <p className="font-bold text-slate-800">{draftIssue.assignedDepartment || manualDepartment}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Assigned Employee</p>
                        <p className={`font-bold ${draftIssue.assignedTo ? 'text-slate-800' : 'text-red-500'}`}>
                          {draftIssue.assignedTo || "No Admins Available"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Expected Resolution Time</p>
                        <p className="font-bold text-slate-800">24 Hours (ETA)</p>
                      </div>
                      <div>
                         <p className="text-slate-500 font-medium">SLA Countdown</p>
                         <p className="font-bold text-indigo-600 font-mono">23:59:59</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Agent Analysis Block */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-500"></div>
               <div className="flex items-center gap-2 mb-4">
                 <Sparkles className="w-5 h-5 text-indigo-600" />
                 <h3 className="font-bold text-slate-800">Gemini Vision Agent Analysis</h3>
               </div>
               
               <div className="grid grid-cols-2 gap-4 mb-4">
                 <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                   <p className="text-xs text-slate-500 uppercase font-semibold mb-1 tracking-wider">Category</p>
                   <p className="font-medium text-slate-800">{aiAnalysis.category}</p>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
                   <div>
                     <p className="text-xs text-slate-500 uppercase font-semibold mb-1 tracking-wider">Severity</p>
                     <p className={`font-medium ${aiAnalysis.severity === 'High' || aiAnalysis.severity === 'Critical' ? 'text-red-600' : 'text-amber-600'}`}>
                       {aiAnalysis.severity}
                     </p>
                   </div>
                   {(aiAnalysis.severity === 'High' || aiAnalysis.severity === 'Critical') && (
                     <AlertTriangle className="w-5 h-5 text-red-500" />
                   )}
                 </div>
               </div>

               {/* Feature 11: AI Reasoning Panel */}
               <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                 <p className="text-xs text-slate-500 uppercase font-bold mb-3 tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                    Agent Reasoning
                 </p>
                 <ul className="space-y-2 text-sm text-slate-700 leading-relaxed">
                   {aiAnalysis.reasoningPoints?.map((point, idx) => (
                     <li key={idx} className="flex items-start gap-2">
                       <span className="text-indigo-400 mt-1">•</span>
                       <span>{point}</span>
                     </li>
                   )) || <li>Analysis complete.</li>}
                 </ul>
               </div>
            </div>

            {/* Feature 4: Trust Engine Verification Block */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2">
                   <ShieldCheck className="w-5 h-5 text-slate-700" />
                   <h3 className="font-bold text-slate-800">Trust Engine Verification</h3>
                 </div>
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${aiAnalysis.trust.status === 'Likely Genuine' ? 'bg-green-100 text-green-700' : ''}
                    ${aiAnalysis.trust.status === 'Needs Review' ? 'bg-amber-100 text-amber-700' : ''}
                    ${aiAnalysis.trust.status === 'Suspicious' ? 'bg-red-100 text-red-700' : ''}
                 `}>
                   {aiAnalysis.trust.status}
                 </span>
               </div>
               
               <div className="space-y-3">
                 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">GPS Coords Provided</span>
                    </div>
                    {aiAnalysis.trust.checks.hasGPS ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                 </div>

                 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Fresh Capture (Metadata)</span>
                    </div>
                    {aiAnalysis.trust.checks.isFresh ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                 </div>

                 <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Vision Confidence &gt; 80%</span>
                    </div>
                    {aiAnalysis.trust.checks.confidenceScore >= 80 ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
                 </div>
               </div>
            </div>

            <div className="text-center">
              <button
                onClick={resetForm}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-6 py-3 rounded-xl transition-colors"
              >
                Report Another Issue
              </button>
            </div>
          </div>
        ) : (
          /* State: Default Form */
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-12 relative overflow-hidden">
            {/* SKELETON LOADER OVERLAY */}
            {isSubmitting && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 animate-fade-in">
                 <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">AI Agent is Analyzing...</h3>
                 <p className="text-slate-500 text-sm mb-8">Running Trust Engine and routing logic</p>
                 
                 {/* Skeleton blocks */}
                 <div className="w-full max-w-md space-y-4">
                    <div className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>
                      <div className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>
                    </div>
                    <div className="h-32 bg-slate-100 rounded-xl animate-pulse"></div>
                 </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Raise an Issue</h2>
                <p className="text-slate-500 text-sm">Help improve your neighborhood</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Camera / Video Trigger */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Evidence Capture</label>
                {imageBase64 ? (
                  <div className="relative rounded-2xl overflow-hidden shadow-sm group">
                    {captureType === "video" ? (
                      <div className="w-full h-48 bg-slate-900 flex flex-col items-center justify-center gap-3">
                        <Film className="w-10 h-10 text-white/60" />
                        <p className="text-white/80 text-sm font-medium">
                          {aiAnalysis ? "Video analyzed successfully" : "Video captured · Ready for analysis"}
                        </p>
                        {aiAnalysis && (
                          <span className="bg-emerald-600/80 text-white text-xs font-bold px-3 py-1 rounded-full">
                            {aiAnalysis.category} detected ({aiAnalysis.confidence ?? aiAnalysis.trust?.checks?.confidenceScore ?? 0}% confidence)
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="relative w-full h-48 bg-slate-900">
                        <img src={imageBase64} alt="Captured" className="w-full h-full object-cover" />
                        {aiAnalysis && (
                          <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-none">
                            <span className="bg-emerald-600/90 backdrop-blur-sm shadow-xl text-white text-xs font-bold px-4 py-2 rounded-full border border-emerald-500">
                              {aiAnalysis.category} detected ({aiAnalysis.confidence ?? aiAnalysis.trust?.checks?.confidenceScore ?? 0}% confidence)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => setShowCapture(true)} className="bg-white/20 backdrop-blur-md text-white font-medium px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white/30 transition-colors">
                        <Camera className="w-5 h-5" /> Retake Evidence
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowCapture(true)} className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors group h-52">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Camera className="w-7 h-7" />
                      </div>
                      <div className="w-14 h-14 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Video className="w-7 h-7" />
                      </div>
                    </div>
                    <p className="text-slate-700 font-bold mb-1">Capture Photo or Video</p>
                    <p className="text-slate-500 text-sm text-center">GPS & timestamp attached automatically. AI analyzes every frame of videos.</p>
                  </button>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g., Huge pothole on the main road, causing traffic issues."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px]"
                  required
                />
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="e.g. Haryana"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                  <input
                    type="text"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="e.g. Rohtak"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Detailed Address / Colony</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Hanuman Nagar, Street 4"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* GPS Status */}
              {gpsCoords ? (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-emerald-900">GPS Location Captured</p>
                      <p className="text-xs text-emerald-700 font-mono">{gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)} {gpsCoords.acc ? `±${Math.round(gpsCoords.acc)}m` : ""}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-800">GPS Required</p>
                    <p className="text-xs text-red-600 mt-1">To prevent false reports, GPS must be captured when you take the photo/video. Please enable location services.</p>
                  </div>
                </div>
              )}

              {/* AI Feedback tips from video analysis */}
              {aiAnalysis?.userFeedback && aiAnalysis.userFeedback.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2">
                  {aiAnalysis.userFeedback.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">{tip}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !location}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-4 rounded-xl transition-all shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center gap-2 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <Sparkles className="w-5 h-5 mr-1" />
                Submit & Analyze with Gemini
              </button>
            </form>
          </div>
        )}

        {showCapture && (
          <EvidenceCapture
            onCapture={handleCapture}
            onCancel={() => setShowCapture(false)}
          />
        )}

      </main>
    </div>
  );
}
