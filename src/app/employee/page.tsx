"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  LogOut, LayoutDashboard, CheckCircle2, Clock, MapPin, AlertTriangle,
  UploadCloud, Search, Activity, Shield, Power, X, ChevronDown, ChevronUp,
  Send, Eye, Briefcase, TrendingUp, FileText, AlertCircle, RefreshCw,
  CheckSquare, Timer, Zap, Star, Target, Award, Camera, MessageSquare,
  ArrowRight, Users, Play, Pause, Wrench, PackageSearch, PhoneCall, Flag, ChevronRight
} from "lucide-react";
import { saveUser } from "@/lib/storage";
import { CameraCapture } from "@/components/CameraCapture";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";

// Feature 10: Haversine distance formula
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

function parseLocation(loc?: string) {
  if (!loc) return null;
  const parts = loc.split(",");
  if (parts.length === 2) {
    return { lat: parseFloat(parts[0]), lon: parseFloat(parts[1]) };
  }
  return null;
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface Issue {
  id: string;
  _id?: string;
  citizenEmail: string;
  imageBase64: string;
  description: string;
  address?: string;
  state?: string;
  city?: string;
  timestamp: number;
  assignedAt?: number;
  aiAnalysis: { category: string; severity: string; department: string; trust: any; reasoningPoints: string[] };
  status: string;
  priority?: string;
  assignedTo?: string;
  assignedDepartment?: string;
  progressPercentage?: number;
  eta?: number;
  timeline: { event?: string; action?: string; comment?: string; timestamp: number; actorName?: string; isPublic?: boolean; attachments?: string[] }[];
  evidences?: { url: string; type: string; category: string; isPublic: boolean; caption?: string; uploadedBy?: string; uploadedAt: string }[];
  resolutionProof?: { imageBase64: string; notes: string };
  citizenFeedback?: { rating: number; comment: string };
}

// ── Priority order for sorting ─────────────────────────────────────────────────
const PRIORITY_ORDER: Record<string, number> = { P1_Critical: 0, P2_High: 1, P3_Medium: 2, P4_Low: 3 };

const PRIORITY_STYLES: Record<string, string> = {
  P1_Critical: "bg-red-100 text-red-800 border-red-200",
  P2_High:     "bg-orange-100 text-orange-800 border-orange-200",
  P3_Medium:   "bg-amber-100 text-amber-800 border-amber-200",
  P4_Low:      "bg-slate-100 text-slate-600 border-emerald-100",
};

// ── Valid actions per status ───────────────────────────────────────────────────
interface WorkflowAction {
  label: string;
  nextStatus: string;
  icon: React.ReactNode;
  color: string;
  requiresNote?: boolean;
  requiresEvidence?: boolean;
  requiresReason?: boolean;
  requiresMaterial?: boolean; // New flag for Material Request
  progressPercentage?: number;
}

const WORKFLOW_ACTIONS: Record<string, WorkflowAction[]> = {
  "Assigned": [
    { label: "Accept Assignment", nextStatus: "Employee Accepted", icon: <CheckSquare className="w-4 h-4" />, color: "bg-green-600 hover:bg-green-700 text-white", progressPercentage: 15 },
    { label: "Reject", nextStatus: "Rejected", icon: <X className="w-4 h-4" />, color: "bg-red-100 hover:bg-red-200 text-red-700 border border-red-200", requiresReason: true },
  ],
  "Employee Accepted": [
    { label: "Start Travelling", nextStatus: "Travelling", icon: <ArrowRight className="w-4 h-4" />, color: "bg-cyan-600 hover:bg-cyan-700 text-white", progressPercentage: 20 },
  ],
  "Travelling": [
    { label: "Mark Reached Site", nextStatus: "Reached Site", icon: <MapPin className="w-4 h-4" />, color: "bg-teal-600 hover:bg-teal-700 text-white", progressPercentage: 25 },
  ],
  "Reached Site": [
    { label: "Start Inspection", nextStatus: "Inspection Started", icon: <Eye className="w-4 h-4" />, color: "bg-purple-600 hover:bg-purple-700 text-white", progressPercentage: 35 },
  ],
  "Inspection Started": [
    { label: "Complete Inspection", nextStatus: "Inspection Completed", icon: <CheckCircle2 className="w-4 h-4" />, color: "bg-violet-600 hover:bg-violet-700 text-white", progressPercentage: 45, requiresNote: true },
    { label: "Request Assistance", nextStatus: "Escalated", icon: <PhoneCall className="w-4 h-4" />, color: "bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-200", requiresNote: true },
  ],
  "Inspection Completed": [
    { label: "Start Repair", nextStatus: "Work Started", icon: <Wrench className="w-4 h-4" />, color: "bg-amber-600 hover:bg-amber-700 text-white", progressPercentage: 55 },
    { label: "Need Materials", nextStatus: "Waiting For Materials", icon: <PackageSearch className="w-4 h-4" />, color: "bg-pink-100 hover:bg-pink-200 text-pink-700 border border-pink-200", requiresMaterial: true },
  ],
  "Work Started": [
    { label: "Mark In Progress", nextStatus: "Work In Progress", icon: <Play className="w-4 h-4" />, color: "bg-orange-600 hover:bg-orange-700 text-white", progressPercentage: 70 },
  ],
  "Work In Progress": [
    { label: "Submit for Verification", nextStatus: "Ready For Verification", icon: <Send className="w-4 h-4" />, color: "bg-emerald-600 hover:bg-emerald-700 text-white", requiresEvidence: true, progressPercentage: 85 },
    { label: "Pause Work", nextStatus: "Paused", icon: <Pause className="w-4 h-4" />, color: "bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-200", requiresNote: true },
    { label: "Need Materials", nextStatus: "Waiting For Materials", icon: <PackageSearch className="w-4 h-4" />, color: "bg-pink-100 hover:bg-pink-200 text-pink-700 border border-pink-200", requiresMaterial: true },
  ],
  "Paused": [
    { label: "Resume Work", nextStatus: "Work In Progress", icon: <Play className="w-4 h-4" />, color: "bg-orange-600 hover:bg-orange-700 text-white", progressPercentage: 70 },
  ],
  "Material Approved": [
    { label: "Materials Received — Resume Work", nextStatus: "Work In Progress", icon: <Wrench className="w-4 h-4" />, color: "bg-amber-600 hover:bg-amber-700 text-white", progressPercentage: 70 },
  ],
};

// ── SLA helpers ────────────────────────────────────────────────────────────────
const getSLAStatus = (timestamp: number, status: string) => {
  if (["Closed", "Rejected"].includes(status)) return "done";
  const ageHours = (Date.now() - timestamp) / 3600000;
  if (ageHours > 168) return "critical"; // > 7 days
  if (ageHours > 120) return "warning";  // > 5 days
  return "ok";
};

const formatSLA = (timestamp: number) => {
  const ageHours = (Date.now() - timestamp) / 3600000;
  const remaining = 168 - ageHours;
  if (remaining < 0) return `${Math.abs(Math.round(remaining))}h overdue`;
  if (remaining < 24) return `${Math.round(remaining)}h left`;
  return `${Math.floor(remaining / 24)}d ${Math.round(remaining % 24)}h left`;
};

const formatDuration = (ms: number) => {
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  return d > 0 ? `${d}d ${h % 24}h` : `${h}h`;
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function EmployeePage() {
  const { appUser, role, loading, logoutMock } = useAuth();
  const router = useRouter();

  type Tab = "dashboard" | "active" | "inprogress" | "completed" | "closed" | "performance";
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Issue workspace
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<"details" | "timeline" | "evidence" | "actions">("actions");
  const [issueTimeline, setIssueTimeline] = useState<any[]>([]);

  // Action state
  const [pendingAction, setPendingAction] = useState<WorkflowAction | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionEvidence, setActionEvidence] = useState<{ url: string; category: string; caption: string } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionMaterial, setActionMaterial] = useState("");
  const [actionQuantity, setActionQuantity] = useState(1);
  const [actionMaterialPriority, setActionMaterialPriority] = useState("Medium");
  const [isActing, setIsActing] = useState(false);

  // Progress note
  const [progressNote, setProgressNote] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [showProgressForm, setShowProgressForm] = useState(false);

  // Evidence upload
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceCategory, setEvidenceCategory] = useState("Inspection");
  const [evidenceCaption, setEvidenceCaption] = useState("");
  const [evidenceIsPublic, setEvidenceIsPublic] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Camera integration
  const [showCamera, setShowCamera] = useState<"action" | "evidence" | null>(null);

  // ── Auth Guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading) {
      if (!appUser) router.push("/login");
      else if (role !== "employee") router.push("/");
      else loadIssues();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser, role, loading]);

  // ── Data Loading ─────────────────────────────────────────────────────────────
  const loadIssues = useCallback(async () => {
    if (!appUser) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/issues?assignedTo=${encodeURIComponent(appUser.email)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAllIssues(Array.isArray(data) ? data.sort((a: Issue, b: Issue) =>
        (PRIORITY_ORDER[a.priority || "P3_Medium"] ?? 2) - (PRIORITY_ORDER[b.priority || "P3_Medium"] ?? 2)
      ) : []);
    } catch (err) { console.error("Failed to load tasks:", err); }
    finally { setIsRefreshing(false); }
  }, [appUser]);

  const openIssue = async (issue: Issue) => {
    setSelectedIssue(issue);
    setWorkspaceTab("actions");
    setPendingAction(null);
    setActionNote(""); setActionReason(""); setActionEvidence(null);
    setProgressNote(""); setProgressPercent(issue.progressPercentage || 0);
    // Fetch fresh timeline for employee (see all events)
    try {
      const res = await fetch(`/api/issues/${issue.id}/timeline?role=employee`);
      const tl = await res.json();
      setIssueTimeline(Array.isArray(tl) ? tl : []);
    } catch { setIssueTimeline(issue.timeline || []); }
  };

  // ── Action Execution ─────────────────────────────────────────────────────────
  const executeAction = async (action: WorkflowAction) => {
    if (!selectedIssue || !appUser) return;

    // Validate requirements
    if (action.requiresNote && !actionNote.trim()) { alert("Please add a note for this action."); return; }
    if (action.requiresReason && !actionReason.trim()) { alert("Please provide a reason."); return; }
    if (action.requiresEvidence && !actionEvidence?.url) { alert("Please upload evidence photo."); return; }
    if (action.requiresMaterial && !actionMaterial.trim()) { alert("Please specify the required material."); return; }
    if (action.requiresMaterial && actionQuantity < 1) { alert("Quantity must be at least 1."); return; }
    if (action.requiresMaterial && !actionNote.trim()) { alert("Please provide a reason/note for the material request."); return; }

    setIsActing(true);
    try {
      const body: any = {
        status: action.nextStatus,
        actorName: appUser.name,
        actorRole: "employee",
        eventName: action.label,
        comment: actionNote || undefined,
        progressPercentage: action.progressPercentage,
      };
      if (action.requiresReason) body.rejectionReason = actionReason;
      if (action.requiresEvidence && actionEvidence) {
        if (action.nextStatus === "Ready For Verification" || action.nextStatus === "Completed") {
          body.resolutionProof = {
            imageBase64: actionEvidence.url,
            notes: actionNote || actionEvidence.caption || action.label,
            timeTaken: "N/A",
            materialUsed: "N/A"
          };
        } else {
          body.evidence = {
            url: actionEvidence.url,
            type: "image",
            category: actionEvidence.category || "Completion",
            isPublic: true,
            caption: actionEvidence.caption || action.label,
          };
        }
      }
      if (action.requiresMaterial) {
        body.materialRequest = {
          material: actionMaterial,
          quantity: actionQuantity,
          reason: actionNote,
          priority: actionMaterialPriority,
          evidenceUrl: actionEvidence?.url
        };
      }

      const res = await fetch(`/api/issues/${selectedIssue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Action failed");
        return;
      }
      setPendingAction(null); setActionNote(""); setActionReason(""); setActionEvidence(null);
      setActionMaterial(""); setActionQuantity(1); setActionMaterialPriority("Medium");
      await loadIssues();
      // Refresh selected issue
      const updatedList = await fetch(`/api/issues?assignedTo=${encodeURIComponent(appUser.email)}`).then(r => r.json());
      const updated = (Array.isArray(updatedList) ? updatedList : []).find((i: Issue) => i.id === selectedIssue.id);
      if (updated) await openIssue(updated);
    } catch (err) { console.error(err); alert("Network error. Please try again."); }
    finally { setIsActing(false); }
  };

  const submitProgressNote = async () => {
    if (!selectedIssue || !appUser || !progressNote.trim()) return;
    setIsActing(true);
    try {
      await fetch(`/api/issues/${selectedIssue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progressNote: { text: progressNote, percentage: progressPercent, isPublic: true },
          actorName: appUser.name, actorRole: "employee"
        }),
      });
      setProgressNote(""); setShowProgressForm(false);
      await loadIssues();
      const tl = await fetch(`/api/issues/${selectedIssue.id}/timeline?role=employee`).then(r => r.json());
      setIssueTimeline(Array.isArray(tl) ? tl : []);
    } catch { alert("Failed to save note"); } finally { setIsActing(false); }
  };

  const uploadEvidence = async () => {
    if (!selectedIssue || !appUser || !evidenceUrl) return;
    setIsActing(true);
    try {
      await fetch(`/api/issues/${selectedIssue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence: { url: evidenceUrl, type: "image", category: evidenceCategory, isPublic: evidenceIsPublic, caption: evidenceCaption },
          actorName: appUser.name, actorRole: "employee"
        }),
      });
      setEvidenceUrl(""); setEvidenceCaption(""); setShowEvidenceForm(false);
      await loadIssues();
    } catch { alert("Failed to upload evidence"); } finally { setIsActing(false); }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser || !newPassword) return;
    await saveUser({ ...appUser, password: newPassword });
    setIsPasswordModalOpen(false); setNewPassword("");
    alert("Password updated.");
  };

  const handleToggleDuty = async () => {
    if (!appUser) return;
    await saveUser({ ...appUser, isAvailable: !(appUser.isAvailable !== false) });
    window.location.reload();
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const ACTIVE_STATUSES = ["Assigned", "Employee Accepted", "Travelling", "Reached Site", "Inspection Started", "Inspection Completed", "Waiting For Materials"];
  const IN_PROGRESS_STATUSES = ["Work Started", "Work In Progress", "Paused", "Material Approved", "Material Requested", "Awaiting Admin Verification", "Ready For Verification"];
  const COMPLETED_STATUSES = ["Repair Completed", "Completed", "Awaiting Citizen Review"];
  const CLOSED_STATUSES = ["Closed", "Rejected"];

  const activeIssues = allIssues.filter(i => ACTIVE_STATUSES.includes(i.status));
  const inProgressIssues = allIssues.filter(i => IN_PROGRESS_STATUSES.includes(i.status));
  const completedIssues = allIssues.filter(i => COMPLETED_STATUSES.includes(i.status));
  const closedIssues = allIssues.filter(i => CLOSED_STATUSES.includes(i.status));
  const criticalIssues = allIssues.filter(i => i.priority === "P1_Critical" && !CLOSED_STATUSES.includes(i.status));
  const highPriorityIssues = allIssues.filter(i => i.priority === "P2_High" && !CLOSED_STATUSES.includes(i.status));
  const todayTasks = allIssues.filter(i => new Date(i.timestamp) > new Date(Date.now() - 86400000));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F9F5]">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!appUser) return null;

  const filterIssues = (list: Issue[]) =>
    !searchQuery ? list : list.filter(i =>
      i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.aiAnalysis.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const performanceStats = {
    totalAssigned: allIssues.length,
    totalCompleted: closedIssues.filter(i => i.status === "Closed").length,
    totalInProgress: inProgressIssues.length + activeIssues.length,
    completionRate: allIssues.length > 0
      ? Math.round((closedIssues.filter(i => i.status === "Closed").length / allIssues.length) * 100) : 0,
    escalated: allIssues.filter(i => i.status === "Escalated").length,
    slaBreached: allIssues.filter(i => getSLAStatus(i.timestamp, i.status) === "critical").length,
  };

  const isOnDuty = appUser?.isAvailable !== false;

  if (role !== "employee") return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F9F5]">
      <div className="text-center p-8 bg-white rounded-none border border-red-200 max-w-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <button onClick={() => router.push("/login")} className="bg-slate-900 text-white px-6 py-2 rounded-none font-bold mt-2">Login</button>
      </div>
    </div>
  );

  // ── Issue Card ────────────────────────────────────────────────────────────────
  const IssueCard = ({ issue }: { issue: Issue }) => {
    const isNew = new Date(issue.timestamp) > new Date(Date.now() - 86400000);
    return (
                    <Card
                      key={issue.id}
                      hoverable
                      onClick={() => openIssue(issue)}
                      className={`border transition-all ${
                        isNew ? "border-info-300 ring-2 ring-info-100 bg-info-50/10" : "border-emerald-100 bg-white"
                      }`}
                    >
                      <div className="p-4 sm:p-5 flex gap-4">
                        {issue.imageBase64 ? (
                          <img src={issue.imageBase64} alt="Issue" className="w-20 h-20 sm:w-28 sm:h-28 rounded-none object-cover border border-emerald-100 flex-shrink-0" />
                        ) : (
                          <div className="w-20 h-20 sm:w-28 sm:h-28 bg-emerald-50 rounded-none border border-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Camera className="w-8 h-8 text-surface-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                            <h3 className="font-bold text-surface-900 text-lg truncate pr-4">{issue.aiAnalysis.category}</h3>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <StatusBadge status={issue.status} />
                            </div>
                          </div>
                          
                          <p className="text-xs text-surface-500 line-clamp-1 mb-2 font-medium">{issue.description}</p>
                          
                          <div className="flex items-center gap-3 text-[11px] font-semibold text-surface-500 mb-2">
                            <span className="font-mono bg-emerald-50 px-2 py-0.5 rounded text-surface-600">{issue.id}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(issue.timestamp).toLocaleDateString()}</span>
                            {issue.address && <span className="flex items-center gap-1 truncate"><MapPin className="w-3.5 h-3.5 text-primary-500" />{issue.address}</span>}
                          </div>
                          
                          <div className="w-full">
                            <div className="flex justify-between text-[10px] font-bold mb-1 uppercase tracking-wider">
                              <span className="text-surface-600">Resolution</span>
                              <span className="text-primary-600">{issue.progressPercentage || 0}%</span>
                            </div>
                            <div className="w-full bg-emerald-50 rounded-full h-2 overflow-hidden border border-emerald-100/50">
                              <div className="bg-gradient-to-r from-primary-400 to-info-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${issue.progressPercentage || 0}%` }} />
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-surface-400 flex-shrink-0 self-center hidden sm:block" />
                      </div>
                    </Card>
    );
  };

  const NAV: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "dashboard",   label: "Dashboard",    icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "active",      label: "Active",        icon: <Activity className="w-5 h-5" />,      count: activeIssues.length },
    { id: "inprogress",  label: "In Progress",   icon: <Wrench className="w-5 h-5" />,        count: inProgressIssues.length },
    { id: "completed",   label: "Completed",     icon: <CheckSquare className="w-5 h-5" />,   count: completedIssues.length },
    { id: "closed",      label: "Closed",        icon: <CheckCircle2 className="w-5 h-5" />,  count: closedIssues.length },
    { id: "performance", label: "Performance",   icon: <Award className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-[100dvh] bg-[#F4F9F5] font-sans overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside className="w-64 bg-emerald-900 text-white flex flex-col flex-shrink-0 z-20 shadow-sm border-r border-emerald-800">
        <div className="p-6 border-b border-surface-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-600 rounded-none flex items-center justify-center shadow-inner-soft">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl leading-tight tracking-tight"><span className="text-emerald-400">FIELD</span> PORTAL</h1>
              <p className="text-xs text-primary-200 font-medium">{appUser.department || "Operations"}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-none text-sm font-bold transition-all ${
                activeTab === item.id
                  ? "bg-primary-600 text-white shadow-md shadow-primary-900/50"
                  : "text-surface-300 hover:bg-emerald-900 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-3">{item.icon}{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === item.id ? "bg-white/20 text-white" : "bg-emerald-900 text-surface-400"}`}>{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-5 border-t border-surface-800 space-y-3">
          <div className="bg-emerald-900 rounded-none p-4 border border-surface-700">
            <p className="font-bold text-sm truncate text-white">{appUser.name}</p>
            <p className="text-[11px] text-surface-400 truncate mb-2">{appUser.email}</p>
            <div className="flex items-center gap-2 bg-emerald-900 px-3 py-1.5 rounded-none border border-surface-700 w-max">
              <div className={`w-2 h-2 rounded-full ${isOnDuty ? "bg-success-400 animate-pulse" : "bg-[#F4F9F5]0"}`} />
              <span className="text-[10px] font-bold tracking-wider uppercase text-surface-300">{isOnDuty ? "On Duty" : "Off Duty"}</span>
            </div>
          </div>
          <button onClick={handleToggleDuty} className={`w-full flex items-center gap-2 justify-center py-3 rounded-none text-sm font-bold transition-all border-2 ${isOnDuty ? "border-success-500/30 bg-success-500/10 text-success-400 hover:bg-success-500/20" : "border-surface-700 bg-emerald-900 text-surface-400 hover:bg-surface-700"}`}>
            <Power className="w-4 h-4" />{isOnDuty ? "Go Off Duty" : "Go On Duty"}
          </button>
          <button onClick={() => setIsPasswordModalOpen(true)} className="w-full flex items-center gap-2 justify-center py-3 rounded-none text-sm font-medium text-surface-400 hover:bg-emerald-900 hover:text-white transition-colors">
            <Shield className="w-4 h-4" />Change Password
          </button>
          <button onClick={logoutMock} className="w-full flex items-center gap-2 justify-center py-3 rounded-none text-sm font-medium text-error-400 hover:bg-error-500/10 transition-colors">
            <LogOut className="w-4 h-4" />Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 h-full overflow-y-auto bg-[#F4F9F5] animate-fade-in pb-[150px]">
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-black text-surface-900 tracking-tight">
                {activeTab === "dashboard"   && "My Dashboard"}
                {activeTab === "active"      && "Active Issues"}
                {activeTab === "inprogress"  && "Work In Progress"}
                {activeTab === "completed"   && "Completed Issues"}
                {activeTab === "closed"      && "Closed Issues"}
                {activeTab === "performance" && "My Performance"}
              </h2>
              <p className="text-surface-500 text-sm font-medium mt-1">{appUser.city ? `${appUser.city}, ` : ""}{appUser.state} · <span className="text-primary-600">{appUser.department}</span></p>
            </div>
            <Button variant="secondary" onClick={loadIssues} disabled={isRefreshing} icon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />}>
              Refresh
            </Button>
          </div>

          {/* Search */}
          {activeTab !== "dashboard" && activeTab !== "performance" && (
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search issues by ID, category, or address…" className="w-full border-2 border-emerald-100 rounded-none pl-12 pr-4 py-3.5 text-sm font-medium bg-white focus:border-primary-500 focus:outline-none shadow-sm transition-colors placeholder:text-surface-400" />
            </div>
          )}

          {/* ═══ DASHBOARD TAB ═══ */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { label: "Active", value: activeIssues.length, icon: <Activity className="w-6 h-6" />, color: "info", bg: "bg-info-50", text: "text-info-600", border: "border-info-200" },
                  { label: "In Progress", value: inProgressIssues.length, icon: <Wrench className="w-6 h-6" />, color: "warning", bg: "bg-warning-50", text: "text-warning-600", border: "border-warning-200" },
                  { label: "Critical", value: criticalIssues.length, icon: <Zap className="w-6 h-6" />, color: "error", bg: "bg-error-50", text: "text-error-600", border: "border-error-200" },
                  { label: "Closed", value: closedIssues.filter(i => i.status === "Closed").length, icon: <CheckCircle2 className="w-6 h-6" />, color: "success", bg: "bg-success-50", text: "text-success-600", border: "border-success-200" },
                ].map(({ label, value, icon, bg, text, border }) => (
                  <Card key={label} className={`border shadow-sm bg-white ${border}`}>
                    <CardContent className="p-5">
                      <div className={`w-12 h-12 ${bg} ${text} rounded-none flex items-center justify-center mb-4`}>{icon}</div>
                      <p className="text-4xl font-black text-surface-900 tracking-tight">{value}</p>
                      <p className="text-sm font-bold text-surface-500 mt-1 uppercase tracking-wider">{label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* SLA Warnings */}
              {allIssues.filter(i => getSLAStatus(i.timestamp, i.status) !== "ok" && getSLAStatus(i.timestamp, i.status) !== "done").length > 0 && (
                <div className="bg-error-50 border border-error-200 rounded-none p-5 shadow-sm">
                  <h3 className="font-black text-error-800 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5" />SLA Warnings</h3>
                  <div className="space-y-2">
                    {allIssues.filter(i => getSLAStatus(i.timestamp, i.status) !== "ok" && getSLAStatus(i.timestamp, i.status) !== "done").map(i => (
                      <div key={i.id} onClick={() => openIssue(i)} className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-none p-4 border border-error-100 cursor-pointer hover:border-error-300 hover:shadow-sm transition-all">
                        <span className="font-mono text-[10px] font-bold text-surface-500 bg-emerald-50 px-2 py-1 rounded">{i.id}</span>
                        <span className="text-sm font-bold text-surface-800 flex-1 min-w-[200px] truncate">{i.aiAnalysis.category}</span>
                        <span className="text-xs font-black text-error-600 bg-error-50 px-3 py-1.5 rounded-none">{formatSLA(i.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Today's Tasks */}
              <Card className="border-emerald-100">
                <CardHeader className="border-b border-emerald-100 pb-4">
                  <h3 className="font-black text-surface-900 flex items-center gap-2"><Target className="w-5 h-5 text-primary-600" />Today's Tasks</h3>
                  <span className="text-sm font-medium text-surface-500 mt-1 block">{todayTasks.length} assigned today</span>
                </CardHeader>
                {todayTasks.length === 0 ? (
                  <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-surface-300" />
                    </div>
                    <p className="text-surface-500 font-medium">No new assignments today</p>
                  </CardContent>
                ) : (
                  <div className="divide-y divide-surface-100">
                    {todayTasks.map(i => (
                      <div key={i.id} onClick={() => openIssue(i)} className="flex items-center gap-4 p-5 hover:bg-[#F4F9F5] cursor-pointer transition-colors">
                        {i.imageBase64 && <img src={i.imageBase64} className="w-12 h-12 rounded-none object-cover flex-shrink-0 border border-emerald-100 shadow-sm" alt="" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-surface-900 text-sm truncate">{i.aiAnalysis.category}</p>
                          <p className="text-[10px] font-mono text-surface-400 mt-0.5">{i.id}</p>
                        </div>
                        <StatusBadge status={i.status} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Recent Active */}
              <Card className="border-emerald-100">
                <CardHeader className="border-b border-emerald-100 pb-4 flex items-center justify-between">
                  <h3 className="font-black text-surface-900 flex items-center gap-2"><Activity className="w-5 h-5 text-primary-600" />Recently Assigned</h3>
                  <button onClick={() => setActiveTab("active")} className="text-primary-600 text-sm font-bold hover:underline">View all →</button>
                </CardHeader>
                <div className="p-5 grid gap-4 bg-[#F4F9F5]/50">
                  {activeIssues.slice(0, 3).map(i => <IssueCard key={i.id} issue={i} />)}
                  {activeIssues.length === 0 && (
                    <div className="py-10 text-center">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckSquare className="w-8 h-8 text-surface-300" />
                      </div>
                      <p className="text-surface-500 font-medium">No active issues</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ═══ ISSUE LIST TABS ═══ */}
          {(activeTab === "active" || activeTab === "inprogress" || activeTab === "completed" || activeTab === "closed") && (() => {
            const listMap: Record<string, Issue[]> = {
              active: filterIssues(activeIssues),
              inprogress: filterIssues(inProgressIssues),
              completed: filterIssues(completedIssues),
              closed: filterIssues(closedIssues),
            };
            const list = listMap[activeTab] || [];
            return (
              <div className="space-y-4">
                {list.length === 0 ? (
                  <Card className="border-emerald-100 text-center py-16">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckSquare className="w-10 h-10 text-surface-300" />
                    </div>
                    <p className="text-xl font-bold text-surface-800 mb-2">No issues here</p>
                    <p className="text-surface-500">You're all caught up in this section.</p>
                  </Card>
                ) : list.map(i => <IssueCard key={i.id} issue={i} />)}
              </div>
            );
          })()}

          {/* ═══ PERFORMANCE TAB ═══ */}

          {activeTab === "performance" && (
            <div className="space-y-6">
              {/* Performance Cards - 4 in one row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Assigned", value: performanceStats.totalAssigned, icon: <FileText className="w-5 h-5" />, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
                  { label: "Completed", value: performanceStats.totalCompleted, icon: <CheckCircle2 className="w-5 h-5" />, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
                  { label: "Completion Rate", value: `${performanceStats.completionRate}%`, icon: <Star className="w-5 h-5" />, bg: "bg-primary-50", text: "text-primary-600", border: "border-primary-200" },
                  { label: "SLA Breached", value: performanceStats.slaBreached, icon: <AlertTriangle className="w-5 h-5" />, bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
                ].map(({ label, value, icon, bg, text, border }) => (
                  <div key={label} className={`bg-white border ${border} rounded-none shadow-sm p-5 relative overflow-hidden group hover:shadow-md transition-shadow`}>
                      <div className="flex justify-between items-start mb-2">
                         <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                         <div className={`${bg} ${text} p-1.5 rounded-none`}>{icon}</div>
                      </div>
                      <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
                  </div>
                ))}
              </div>

              {/* Detailed Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recent Activity Feed */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-600" /> Recent Operations</h3>
                      <button onClick={() => setActiveTab("dashboard")} className="text-emerald-600 text-[11px] font-bold hover:underline uppercase tracking-wider">View All</button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {allIssues.slice(0, 5).map(issue => (
                        <div key={issue.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-emerald-50/30 transition-colors cursor-pointer" onClick={() => openIssue(issue)}>
                          {issue.imageBase64 && <img src={issue.imageBase64} className="w-12 h-12 rounded-none object-cover flex-shrink-0 border border-slate-200" alt="" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-none">{issue.id}</span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-none ${issue.status === "Closed" || issue.status === "Work Completed" ? "bg-emerald-100 text-emerald-700" : issue.status === "In Progress" || issue.status === "Work In Progress" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{issue.status}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm truncate">{issue.description ? issue.description.substring(0, 50) + "..." : "Issue Report"}</h4>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                             <div>{new Date(issue.timestamp).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                      {allIssues.length === 0 && (
                        <div className="p-8 text-center text-slate-500 text-sm">No recent assignments found.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Side Panel */}
                <div className="space-y-6">
                  {/* Issue Breakdown */}
                  <div className="bg-white border border-emerald-100 rounded-none shadow-sm">
                    <div className="border-b border-emerald-100 bg-emerald-50/50 p-4">
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> Issue Breakdown</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-[#F4F9F5]/50">
                      {[
                        { label: "Critical", value: criticalIssues.length, color: "bg-rose-500" },
                        { label: "High", value: highPriorityIssues.length, color: "bg-orange-500" },
                        { label: "In Progress", value: inProgressIssues.length, color: "bg-amber-500" },
                        { label: "Completed", value: completedIssues.length, color: "bg-emerald-500" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="text-center p-3 bg-white border border-emerald-100 rounded-none shadow-sm">
                          <div className={`w-2 h-2 rounded-full ${color} mx-auto mb-2 shadow-inner-soft`} />
                          <p className="text-2xl font-black text-slate-900">{value}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}


        </div>
      </main>

      {/* ── ISSUE WORKSPACE DRAWER ── */}
      {selectedIssue && (
        <div className="fixed inset-0 z-[100] flex animate-fade-in">
          <div className="flex-1 bg-emerald-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedIssue(null)} />
          <div className="w-full max-w-2xl bg-[#F4F9F5] h-full flex flex-col shadow-2xl overflow-hidden animate-slide-up sm:animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-emerald-100 bg-white flex items-start justify-between flex-shrink-0 z-20">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-mono text-[10px] font-bold text-surface-500 bg-emerald-50 px-2 py-1 rounded-md">{selectedIssue.id}</span>
                  <StatusBadge status={selectedIssue.status} />
                </div>
                <h2 className="text-2xl font-black text-surface-900 tracking-tight">{selectedIssue.aiAnalysis.category}</h2>
                <p className="text-sm text-surface-500 font-medium flex items-center gap-1 mt-1"><MapPin className="w-4 h-4 text-primary-500" />{selectedIssue.address || `${selectedIssue.city}, ${selectedIssue.state}`}</p>
              </div>
              <button onClick={() => setSelectedIssue(null)} className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-surface-500 hover:bg-surface-200 hover:text-surface-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-6 py-4 border-b border-emerald-100 bg-white flex-shrink-0">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                <span className="text-surface-600">Resolution Progress</span>
                <span className="text-primary-600">{selectedIssue.progressPercentage || 0}%</span>
              </div>
              <div className="w-full bg-emerald-50 rounded-full h-2.5 overflow-hidden border border-emerald-100/50">
                <div className="bg-gradient-to-r from-primary-400 to-info-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${selectedIssue.progressPercentage || 0}%` }} />
              </div>
            </div>

            {/* Workspace Tabs */}
            <div className="flex bg-white flex-shrink-0 px-2">
              {(["actions", "details", "timeline", "evidence"] as const).map(t => (
                <button key={t} onClick={() => setWorkspaceTab(t)} className={`flex-1 py-4 px-2 text-[11px] font-black uppercase tracking-wider transition-all border-b-2 ${workspaceTab === t ? "border-primary-600 text-primary-700 bg-primary-50/50" : "border-transparent text-surface-400 hover:text-surface-600 hover:bg-[#F4F9F5]"}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* ─ ACTIONS TAB ─ */}
              {workspaceTab === "actions" && (() => {
                const actions = WORKFLOW_ACTIONS[selectedIssue.status] || [];
                return (
                  <div className="space-y-4">
                    {actions.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No actions available</p>
                        <p className="text-slate-400 text-sm">Status: {selectedIssue.status}</p>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Available Actions</h3>
                        <div className="flex flex-col gap-2">
                          {actions.map(action => (
                            <div key={action.nextStatus}>
                              <button
                                onClick={() => { setPendingAction(prev => prev?.nextStatus === action.nextStatus ? null : action); setActionNote(""); setActionReason(""); setActionEvidence(null); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none text-sm font-bold transition-all ${action.color} ${pendingAction?.nextStatus === action.nextStatus ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}
                              >
                                {action.icon}{action.label}
                              </button>

                              {pendingAction?.nextStatus === action.nextStatus && (
                                <div className="mt-2 p-4 bg-[#F4F9F5] rounded-none border border-emerald-100 space-y-3">
                                  {action.requiresNote && (
                                    <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1">Add Note *</label>
                                      <textarea value={actionNote} onChange={e => setActionNote(e.target.value)} placeholder="Describe what you found / did…" className="w-full border border-emerald-100 bg-white rounded-none p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500" rows={3} />
                                    </div>
                                  )}
                                  {action.requiresReason && (
                                    <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Rejection *</label>
                                      <textarea value={actionReason} onChange={e => setActionReason(e.target.value)} placeholder="Explain why…" className="w-full border border-emerald-100 bg-white rounded-none p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500" rows={3} />
                                    </div>
                                  )}
                                  {action.requiresEvidence && (
                                    <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1">Upload Evidence Photo *</label>
                                      {actionEvidence?.url ? (
                                        <div className="relative inline-block mt-1">
                                          <img src={actionEvidence.url} className="h-24 rounded-none object-cover border" alt="preview" />
                                          <button onClick={() => setActionEvidence(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                                        </div>
                                      ) : (
                                        <button onClick={() => setShowCamera("action")} className="w-full border-2 border-dashed border-slate-300 rounded-none py-4 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors">
                                          <Camera className="w-6 h-6 mb-1" />
                                          <span className="text-xs font-bold">Capture Photo</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  {action.requiresMaterial && (
                                    <div className="space-y-3 border-t border-emerald-100 pt-3 mt-3">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-xs font-bold text-slate-700 mb-1">Required Material *</label>
                                          <input type="text" value={actionMaterial} onChange={e => setActionMaterial(e.target.value)} placeholder="e.g. Cement bags" className="w-full border border-emerald-100 bg-white rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-bold text-slate-700 mb-1">Quantity *</label>
                                          <input type="number" min="1" value={actionQuantity} onChange={e => setActionQuantity(Number(e.target.value))} className="w-full border border-emerald-100 bg-white rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                                        <select value={actionMaterialPriority} onChange={e => setActionMaterialPriority(e.target.value)} className="w-full border border-emerald-100 bg-white rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500">
                                          <option value="Low">Low (Can wait)</option>
                                          <option value="Medium">Medium</option>
                                          <option value="High">High (Blocking work)</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Note *</label>
                                        <textarea 
                                          value={actionNote} 
                                          onChange={e => setActionNote(e.target.value)} 
                                          placeholder="Why is this material needed?" 
                                          className="w-full border border-emerald-100 bg-white rounded-none p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500" 
                                          rows={2} 
                                        />
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex gap-2">
                                    <button onClick={() => executeAction(action)} disabled={isActing} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-none text-sm transition-colors disabled:opacity-50">
                                      {isActing ? "Processing…" : `Confirm: ${action.label}`}
                                    </button>
                                    <button onClick={() => setPendingAction(null)} className="text-slate-500 px-4 py-2 rounded-none text-sm hover:bg-slate-200 transition-colors">Cancel</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Progress Note */}
                    <div className="border-t border-emerald-100 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add Progress Note</h3>
                        <button onClick={() => setShowProgressForm(!showProgressForm)} className="text-emerald-600 text-xs font-bold hover:underline">{showProgressForm ? "Cancel" : "+ Add Note"}</button>
                      </div>
                      {showProgressForm && (
                        <div className="space-y-3 bg-[#F4F9F5] p-4 rounded-none border border-emerald-100">
                          <div>
                            <label className="text-xs font-bold text-slate-700 mb-1 block">Progress: {progressPercent}%</label>
                            <input type="range" min={0} max={100} value={progressPercent} onChange={e => setProgressPercent(Number(e.target.value))} className="w-full accent-emerald-600" />
                          </div>
                          <textarea value={progressNote} onChange={e => setProgressNote(e.target.value)} placeholder="Describe current progress…" className="w-full border border-emerald-100 bg-white rounded-none p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500" rows={3} />
                          <button onClick={submitProgressNote} disabled={isActing || !progressNote.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-none text-sm disabled:opacity-50">Save Progress Note</button>
                        </div>
                      )}
                    </div>

                    {/* Evidence Upload */}
                    <div className="border-t border-emerald-100 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upload Evidence</h3>
                        <button onClick={() => setShowEvidenceForm(!showEvidenceForm)} className="text-emerald-600 text-xs font-bold hover:underline">{showEvidenceForm ? "Cancel" : "+ Upload"}</button>
                      </div>
                      {showEvidenceForm && (
                        <div className="space-y-3 bg-[#F4F9F5] p-4 rounded-none border border-emerald-100">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-slate-700 mb-1 block">Category</label>
                              <select value={evidenceCategory} onChange={e => setEvidenceCategory(e.target.value)} className="w-full border border-emerald-100 bg-white rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <option>Site Visit</option><option>Inspection</option><option>Repair</option><option>Completion</option><option>Other</option>
                              </select>
                            </div>
                            <div className="flex items-end">
                              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                <input type="checkbox" checked={evidenceIsPublic} onChange={e => setEvidenceIsPublic(e.target.checked)} className="rounded accent-emerald-600" />
                                <span className="font-medium">Make Public</span>
                              </label>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-700 mb-1 block">Photo</label>
                            {evidenceUrl ? (
                              <div className="relative inline-block mt-2">
                                <img src={evidenceUrl} className="h-24 rounded-none object-cover border" alt="preview" />
                                <button onClick={() => setEvidenceUrl("")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                              </div>
                            ) : (
                              <button onClick={() => setShowCamera("evidence")} className="w-full border-2 border-dashed border-slate-300 rounded-none py-4 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors">
                                <Camera className="w-6 h-6 mb-1" />
                                <span className="text-xs font-bold">Capture Photo</span>
                              </button>
                            )}
                          </div>
                          <input type="text" value={evidenceCaption} onChange={e => setEvidenceCaption(e.target.value)} placeholder="Caption (optional)" className="w-full border border-emerald-100 bg-white rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          <button onClick={uploadEvidence} disabled={isActing || !evidenceUrl} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-none text-sm disabled:opacity-50">Upload Evidence</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ─ DETAILS TAB ─ */}
              {workspaceTab === "details" && (
                <div className="space-y-4">
                  {selectedIssue.imageBase64 && <img src={selectedIssue.imageBase64} alt="Issue" className="w-full h-48 object-cover rounded-none border" />}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Issue ID", selectedIssue.id],
                      ["Category", selectedIssue.aiAnalysis.category],
                      ["Priority", (selectedIssue.priority || "P3_Medium").replace(/P\d_/, "")],
                      ["Status", selectedIssue.status],
                      ["Department", selectedIssue.assignedDepartment || "—"],
                      ["Reported", new Date(selectedIssue.timestamp).toLocaleString()],
                      ["Progress", `${selectedIssue.progressPercentage || 0}%`],
                      ["SLA", formatSLA(selectedIssue.timestamp)],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-[#F4F9F5] rounded-none p-3">
                        <p className="text-xs text-slate-400 font-bold uppercase">{label}</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#F4F9F5] rounded-none p-4">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-2">Description</p>
                    <p className="text-sm text-slate-700">{selectedIssue.description}</p>
                  </div>
                  {selectedIssue.address && (
                    <div className="bg-[#F4F9F5] rounded-none p-4">
                      <p className="text-xs text-slate-400 font-bold uppercase mb-1">Location</p>
                      <p className="text-sm text-slate-700 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-600" />{selectedIssue.address}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ─ TIMELINE TAB ─ */}
              {workspaceTab === "timeline" && (
                <div>
                  {issueTimeline.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">No timeline events yet</p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-emerald-100 ml-4 space-y-5">
                      {issueTimeline.map((event, i) => (
                        <div key={String(event._id) || i} className="relative pl-6">
                          <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 ring-2 ring-white ${event.isPublic ? "bg-emerald-500" : "bg-slate-400"}`} />
                          <p className="text-sm font-bold text-slate-800">{event.comment || event.action}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {event.actorName && <span className="text-xs text-slate-500">{event.actorName}</span>}
                            <span className="text-xs text-slate-400">{new Date(event.timestamp).toLocaleString()}</span>
                            {!event.isPublic && <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Internal</span>}
                            {event.progressPercentage !== undefined && (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{event.progressPercentage}%</span>
                            )}
                          </div>
                          {event.attachments?.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {event.attachments.map((att: string, ai: number) => (
                                <img key={ai} src={att} className="h-16 w-24 object-cover rounded-none border" alt="evidence" />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ─ EVIDENCE TAB ─ */}
              {workspaceTab === "evidence" && (
                <div>
                  {(!selectedIssue.evidences || selectedIssue.evidences.length === 0) && !selectedIssue.resolutionProof ? (
                    <div className="text-center py-8">
                      <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">No evidence uploaded yet</p>
                      <p className="text-slate-400 text-sm mt-1">Use the Actions tab to upload evidence</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedIssue.evidences?.map((ev, i) => (
                        <div key={i} className="bg-[#F4F9F5] rounded-none border border-emerald-100 overflow-hidden">
                          <img src={ev.url} alt={ev.caption} className="w-full h-40 object-cover" />
                          <div className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ev.isPublic ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                                {ev.category} · {ev.isPublic ? "Public" : "Internal"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">{ev.caption || "—"}</p>
                            <p className="text-xs text-slate-400">{ev.uploadedBy} · {new Date(ev.uploadedAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                      {selectedIssue.resolutionProof && (
                        <div className="bg-green-50 border border-green-200 rounded-none overflow-hidden">
                          <img src={selectedIssue.resolutionProof.imageBase64} alt="Resolution" className="w-full h-40 object-cover" />
                          <div className="p-3">
                            <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Resolution Proof</span>
                            <p className="text-sm text-slate-700 mt-2">{selectedIssue.resolutionProof.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PASSWORD MODAL ── */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-none w-full max-w-sm p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Change Password</h2>
              <button onClick={() => setIsPasswordModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" className="w-full border border-emerald-100 rounded-none px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-none">Update Password</button>
            </form>
          </div>
        </div>
      )}

      {showCamera && (
        <CameraCapture
          isEmployee={true}
          officialOnly={true}
          onCapture={(base64, meta) => {
            if (!meta.latitude || !meta.longitude) {
              alert("GPS location is strictly required to submit official evidence. Please enable GPS and try again.");
              setShowCamera(null);
              return;
            }

            let distanceStr = "";
            if (meta.latitude && meta.longitude && selectedIssue) {
              const rawIssueLoc = (selectedIssue as any).location;
              if (rawIssueLoc) {
                const issueCoords = parseLocation(rawIssueLoc);
                if (issueCoords) {
                  const dist = Math.round(getDistanceFromLatLonInMeters(meta.latitude, meta.longitude, issueCoords.lat, issueCoords.lon));
                  distanceStr = ` (Distance from report: ${dist}m)`;
                }
              }
            }

            if (showCamera === "action") {
              setActionEvidence({
                url: base64,
                category: "Completion",
                caption: `Work completion photo${distanceStr}`
              });
            } else {
              setEvidenceUrl(base64);
              if (distanceStr) setEvidenceCaption(prev => prev ? prev + distanceStr : `Evidence${distanceStr}`);
            }
            setShowCamera(null);
          }}
          onCancel={() => setShowCamera(null)}
        />
      )}
    </div>
  );
}
