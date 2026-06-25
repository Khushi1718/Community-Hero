"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  LogOut, LayoutDashboard, CheckCircle2, Clock, MapPin, AlertTriangle,
  UploadCloud, Search, Activity, Shield, Users, Power, FolderKanban,
  UsersRound, X, ChevronDown, ChevronUp, Send, Eye, Briefcase,
  TrendingUp, FileText, UserCheck, AlertCircle, RefreshCw, Plus, CheckSquare, PackageSearch
} from "lucide-react";
import { IssueStatus, AppUser, saveUser } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";

interface Issue {
  id: string;
  _id?: string;
  citizenEmail: string;
  imageBase64: string;
  description: string;
  location: string;
  state?: string;
  city?: string;
  address?: string;
  timestamp: number;
  aiAnalysis: { category: string; severity: string; department: string; trust: any; reasoningPoints: string[] };
  status: string;
  priority?: string;
  assignedTo?: string;
  assignedAdmin?: string;
  assignedDepartment?: string;
  progressPercentage?: number;
  eta?: number;
  timeline: { event: string; timestamp: number; actorName?: string; actorRole?: string; metadata?: any }[];
  progressUpdates?: { timestamp: number; note: string; author: string; progressPercentage?: number; attachments?: string[] }[];
  resolutionProof?: { imageBase64: string; notes: string; timeTaken?: string; materialUsed?: string };
  citizenFeedback?: { rating: number; comment: string };
  verificationScore?: number;
  cameraSource?: string;
  deviceInfo?: string;
  browserInfo?: string;
  evidences?: { url: string; type?: string; category?: string; caption?: string; isPublic?: boolean }[];
}

const STATUS_COLORS: Record<string, string> = {
  "Reported": "bg-slate-100 text-slate-700",
  "Open": "bg-slate-100 text-slate-700",
  "Assigned": "bg-blue-100 text-blue-700",
  "In Progress": "bg-amber-100 text-amber-700",
  "Work In Progress": "bg-amber-100 text-amber-700",
  "Work Started": "bg-amber-100 text-amber-700",
  "Work Completed": "bg-teal-100 text-teal-700",
  "Awaiting Citizen Review": "bg-purple-100 text-purple-700",
  "Closed": "bg-green-100 text-green-700",
  "Resolved": "bg-green-100 text-green-700",
  "Rejected": "bg-red-100 text-red-700",
  "Escalated": "bg-orange-100 text-orange-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  "P1_Critical": "bg-red-100 text-red-700 border-red-200",
  "P2_High": "bg-orange-100 text-orange-700 border-orange-200",
  "P3_Medium": "bg-amber-100 text-amber-700 border-amber-200",
  "P4_Low": "bg-slate-100 text-slate-600 border-slate-200",
};

export default function AdminPage() {
  const { appUser, role, loading, logoutMock } = useAuth();
  const router = useRouter();

  type Tab = "home" | "live" | "resolved" | "materials" | "verify" | "employees";
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [employees, setEmployees] = useState<AppUser[]>([]);
  const [kpi, setKpi] = useState({ open: 0, inProgress: 0, resolved: 0, escalated: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Issue detail expansion
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);

  // Assignment
  const [assigningIssueId, setAssigningIssueId] = useState<string | null>(null);
  const [selectedWorkerEmail, setSelectedWorkerEmail] = useState("");

  // Resolution proof upload (admin can also resolve)
  const [resolvingIssueId, setResolvingIssueId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolutionImageBase64, setResolutionImageBase64] = useState("");

  // Add employee form
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpEmail, setNewEmpEmail] = useState("");
  const [newEmpPassword, setNewEmpPassword] = useState("");
  const [empFormMsg, setEmpFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password change
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState("");

  // ── Auth Guard ──────────────────────────────────────────────
  useEffect(() => {
    if (!loading) {
      if (!appUser) {
        router.push("/login");
      } else if (role !== "admin") {
        router.push("/");
      } else {
        loadAll();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser, role, loading]);

  // ── Data Loading ────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!appUser) return;
    setIsRefreshing(true);
    try {
      await Promise.all([loadIssues(), loadEmployees()]);
    } finally {
      setIsRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser]);

  const loadIssues = async () => {
    if (!appUser) return;
    const params = new URLSearchParams();
    if (appUser.state) params.append("state", appUser.state);
    if (appUser.city) params.append("city", appUser.city);
    if (appUser.department) params.append("department", appUser.department);

    const [byJurisdiction, byAdmin] = await Promise.all([
      fetch(`/api/issues?${params}`).then(r => r.json()).catch(() => []),
      fetch(`/api/issues?assignedAdmin=${encodeURIComponent(appUser.email)}`).then(r => r.json()).catch(() => []),
    ]);

    const map = new Map<string, Issue>();
    [...(Array.isArray(byJurisdiction) ? byJurisdiction : []),
     ...(Array.isArray(byAdmin) ? byAdmin : [])].forEach((i: Issue) => map.set(i.id, i));
    const merged = Array.from(map.values());
    setAllIssues(merged);

    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    setKpi({
      open: merged.filter(i => ["Reported", "Open", "Verified"].includes(i.status)).length,
      inProgress: merged.filter(i => ["Assigned", "In Progress", "Work In Progress", "Work Started", "Site Visit Scheduled", "Employee Reached Site", "Inspection Started", "Work Completed"].includes(i.status)).length,
      resolved: merged.filter(i => ["Closed", "Resolved", "Awaiting Citizen Review"].includes(i.status)).length,
      escalated: merged.filter(i => !["Closed", "Resolved", "Rejected"].includes(i.status) && Date.now() - i.timestamp > SEVEN_DAYS).length,
    });
  };

  const loadEmployees = async () => {
    if (!appUser) return;
    const [byAdmin, allUsers] = await Promise.all([
      fetch(`/api/users?createdByAdmin=${encodeURIComponent(appUser.email)}`).then(r => r.json()).catch(() => []),
      fetch("/api/users").then(r => r.json()).catch(() => []),
    ]);
    const legacyEmps = (Array.isArray(allUsers) ? allUsers : []).filter((u: any) =>
      u.role === "employee" && u.state === appUser.state && (!appUser.city || u.city === appUser.city) &&
      (!appUser.department || u.department === appUser.department) &&
      !(Array.isArray(byAdmin) ? byAdmin : []).find((e: any) => e.email === u.email)
    );
    const all = [...(Array.isArray(byAdmin) ? byAdmin : []), ...legacyEmps];
    setEmployees(all);
    if (all.length > 0 && !selectedWorkerEmail) setSelectedWorkerEmail(all[0].email);
  };

  // ── Actions ─────────────────────────────────────────────────
  const handleAssign = async (issueId: string) => {
    if (!selectedWorkerEmail || !appUser) return;
    await fetch(`/api/issues/${issueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedTo: selectedWorkerEmail, actorName: appUser.name, actorRole: "admin" })
    });
    setAssigningIssueId(null);
    loadIssues();
  };

  const handleStatusUpdate = async (issueId: string, status: string, eventName?: string) => {
    if (!appUser) return;
    await fetch(`/api/issues/${issueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, eventName: eventName || `Status set to ${status}`, actorName: appUser.name, actorRole: "admin" })
    });
    loadIssues();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { const r = new FileReader(); r.onloadend = () => setResolutionImageBase64(r.result as string); r.readAsDataURL(f); }
  };

  const submitResolution = async (issueId: string) => {
    if (!resolutionNotes || !resolutionImageBase64) { alert("Both image and notes are required."); return; }
    await fetch(`/api/issues/${issueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolutionProof: { imageBase64: resolutionImageBase64, notes: resolutionNotes }, actorName: appUser?.name, actorRole: "admin" })
    });
    setResolvingIssueId(null); setResolutionNotes(""); setResolutionImageBase64("");
    loadIssues();
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpEmail || !newEmpName || !newEmpPassword || !appUser) return;
    setEmpFormMsg(null);
    try {
      await saveUser({
        email: newEmpEmail, name: newEmpName, role: "employee",
        state: appUser.state, city: appUser.city, department: appUser.department,
        password: newEmpPassword, isAvailable: true, createdByAdmin: appUser.email
      });
      setEmpFormMsg({ type: "success", text: `Employee ${newEmpName} created successfully!` });
      setNewEmpName(""); setNewEmpEmail(""); setNewEmpPassword("");
      loadEmployees();
    } catch {
      setEmpFormMsg({ type: "error", text: "Failed to create employee. Try again." });
    }
  };

  const handleToggleAdminStatus = async () => {
    if (!appUser) return;
    await saveUser({ ...appUser, isAvailable: !(appUser.isAvailable !== false) });
    window.location.reload();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser || !newAdminPassword) return;
    await saveUser({ ...appUser, password: newAdminPassword });
    setIsPasswordModalOpen(false); setNewAdminPassword("");
    alert("Password updated successfully.");
  };

  // ── Derived Data ────────────────────────────────────────────
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const liveIssues = allIssues.filter(i => !["Closed", "Resolved", "Rejected"].includes(i.status));
  const resolvedIssues = allIssues.filter(i => ["Closed", "Resolved", "Awaiting Citizen Review"].includes(i.status));

  const filteredLive = liveIssues.filter(i =>
    !searchQuery || i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.aiAnalysis.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredResolved = resolvedIssues.filter(i =>
    !searchQuery || i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.aiAnalysis.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || !appUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading Admin Dashboard…</p>
        </div>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-3xl border border-red-200 shadow-sm max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-4">You don't have admin privileges.</p>
          <button onClick={() => router.push("/login")} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold">Go to Login</button>
        </div>
      </div>
    );
  }

  const isOnDuty = appUser.isAvailable !== false;

  // ── Issue Card Component ────────────────────────────────────
  const IssueCard = ({ issue, showActions = true }: { issue: Issue; showActions?: boolean }) => {
    const isExpanded = expandedIssueId === issue.id;
    const isEscalated = !["Closed", "Resolved", "Rejected"].includes(issue.status) && Date.now() - issue.timestamp > SEVEN_DAYS;
    const priorityLabel = (issue.priority || "P3_Medium").replace(/P\d_/, "");
    const priorityClass = PRIORITY_COLORS[issue.priority || "P3_Medium"] || PRIORITY_COLORS["P3_Medium"];

    return (
      <div className={`bg-white border rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-md ${isEscalated ? "border-orange-300" : "border-slate-200"}`}>
        {/* Card Header */}
        <div
          className="p-5 cursor-pointer"
          onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {issue.imageBase64 && (
                <img src={issue.imageBase64} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{issue.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[issue.status] || "bg-slate-100 text-slate-600"}`}>
                    {issue.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${priorityClass}`}>{priorityLabel}</span>
                  {isEscalated && (
                    <span className="bg-orange-600 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Escalated
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-base truncate">{issue.aiAnalysis.category}</h3>
                <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{issue.description}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {new Date(issue.timestamp).toLocaleDateString()}
              </div>
              {issue.progressPercentage !== undefined && (
                <div className="w-24">
                  <div className="flex justify-between text-[10px] font-bold mb-0.5">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-purple-600">{issue.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-purple-600 h-1.5 rounded-full transition-all" style={{ width: `${issue.progressPercentage}%` }} />
                  </div>
                </div>
              )}
              {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
            {issue.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{issue.address}</span>}
            {issue.assignedTo && <span className="flex items-center gap-1 text-purple-700 font-medium"><UserCheck className="w-3.5 h-3.5" />Assigned: {issue.assignedTo}</span>}
            {issue.citizenEmail && <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{issue.citizenEmail}</span>}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-slate-100 bg-slate-50 p-5 space-y-5">
            
            {/* Verification Metadata */}
            {(issue.verificationScore !== undefined || issue.cameraSource) && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" /> Verification & Source Metadata
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {issue.verificationScore !== undefined && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase">Verification Score</p>
                      <p className={`text-lg font-black mt-1 ${issue.verificationScore >= 80 ? 'text-green-600' : issue.verificationScore >= 50 ? 'text-orange-600' : 'text-red-600'}`}>{issue.verificationScore}/100</p>
                    </div>
                  )}
                  {issue.cameraSource && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase">Image Source</p>
                      <p className="text-sm font-bold text-slate-800 mt-1">{issue.cameraSource}</p>
                    </div>
                  )}
                  {issue.deviceInfo && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
                      <p className="text-xs font-bold text-slate-500 uppercase">Device Metadata</p>
                      <p className="text-xs font-medium text-slate-700 mt-1 truncate" title={issue.deviceInfo}>{issue.deviceInfo}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            {issue.timeline && issue.timeline.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> Timeline
                </h4>
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-4">
                  {[...issue.timeline, ...(issue.progressUpdates || []).map(p => ({ event: p.note, timestamp: p.timestamp, actorName: p.author, metadata: { attachments: p.attachments } }))].sort((a, b) => a.timestamp - b.timestamp).slice(-8).map((e, i) => (
                    <div key={i} className="relative pl-5">
                      <div className="absolute w-3 h-3 rounded-full -left-[7px] top-1 bg-purple-400 ring-2 ring-white" />
                      <p className="text-sm font-medium text-slate-700">{(e as any).event || (e as any).note}</p>
                      {(e as any).actorName && <p className="text-xs text-slate-400">{(e as any).actorName}</p>}
                      <p className="text-xs text-slate-400">{new Date(e.timestamp).toLocaleString()}</p>
                      {(e as any).metadata?.attachments?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {(e as any).metadata.attachments.map((att: string, ai: number) => (
                            <img key={ai} src={att} className="h-16 w-24 object-cover rounded-lg border" alt="evidence" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Proof (from employee) */}
            {issue.resolutionProof && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Employee Resolution Proof
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {issue.imageBase64 && <div><p className="text-xs text-slate-500 mb-1">Before</p><img src={issue.imageBase64} className="w-full h-28 object-cover rounded-lg border" alt="before" /></div>}
                  <div><p className="text-xs text-green-600 font-bold mb-1">After (Evidence)</p><img src={issue.resolutionProof.imageBase64} className="w-full h-28 object-cover rounded-lg border border-green-300" alt="after" /></div>
                </div>
                <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border">{issue.resolutionProof.notes}</p>
                {issue.resolutionProof.timeTaken && <p className="text-xs text-slate-500 mt-1">Time taken: {issue.resolutionProof.timeTaken}</p>}
              </div>
            )}

            {/* Citizen Feedback */}
            {issue.citizenFeedback && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-blue-800 mb-2">Citizen Feedback</h4>
                <div className="flex items-center gap-2 mb-1">
                  {"★".repeat(issue.citizenFeedback.rating)}{"☆".repeat(5 - issue.citizenFeedback.rating)}
                  <span className="text-sm font-bold text-blue-700">{issue.citizenFeedback.rating}/5</span>
                </div>
                <p className="text-sm text-slate-700">{issue.citizenFeedback.comment}</p>
              </div>
            )}

            {/* Admin Actions */}
            {showActions && !["Closed", "Resolved", "Rejected"].includes(issue.status) && (
              <div className="flex flex-wrap gap-3">
                {/* Assign Worker */}
                {employees.length > 0 && (
                  assigningIssueId === issue.id ? (
                    <div className="flex gap-2 items-center">
                      <select
                        value={selectedWorkerEmail}
                        onChange={e => setSelectedWorkerEmail(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        {employees.map(emp => <option key={emp.email} value={emp.email}>{emp.name} ({emp.isAvailable !== false ? "On Duty" : "Off Duty"})</option>)}
                      </select>
                      <button onClick={() => handleAssign(issue.id)} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors">Assign</button>
                      <button onClick={() => setAssigningIssueId(null)} className="text-slate-500 px-3 py-2 rounded-xl text-sm hover:bg-slate-200 transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setAssigningIssueId(issue.id)} className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                      <Send className="w-4 h-4" /> {issue.assignedTo ? "Reassign" : "Assign Employee"}
                    </button>
                  )
                )}

                {/* Status Quick Actions */}
                {issue.status === "Reported" || issue.status === "Open" ? (
                  <>
                    <button onClick={() => handleStatusUpdate(issue.id, "In Progress", "Admin accepted — In Progress")} className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                      <Activity className="w-4 h-4" /> Accept
                    </button>
                    <button onClick={() => handleStatusUpdate(issue.id, "Rejected", "Rejected by Admin")} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </>
                ) : null}

                {["Work Completed", "Awaiting Citizen Review"].includes(issue.status) && (
                  <button onClick={() => handleStatusUpdate(issue.id, "Closed", "Verified & Closed by Admin")} className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                    <CheckCircle2 className="w-4 h-4" /> Close Issue
                  </button>
                )}

                {/* Admin Resolution Upload */}
                {resolvingIssueId === issue.id ? (
                  <div className="w-full bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-slate-800 text-sm">Upload Resolution Proof</h4>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm text-slate-600" />
                    {resolutionImageBase64 && <img src={resolutionImageBase64} className="h-24 rounded-lg object-cover" alt="preview" />}
                    <textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} placeholder="Resolution notes…" className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500" rows={3} />
                    <div className="flex gap-2">
                      <button onClick={() => submitResolution(issue.id)} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700">Submit</button>
                      <button onClick={() => setResolvingIssueId(null)} className="text-slate-500 px-4 py-2 rounded-xl text-sm hover:bg-slate-100">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setResolvingIssueId(issue.id)} className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                    <UploadCloud className="w-4 h-4" /> Resolve
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────
  const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "home", label: "Overview", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "live", label: "Live Reports", icon: <Activity className="w-5 h-5" />, badge: liveIssues.length },
    { id: "materials", label: "Materials", icon: <PackageSearch className="w-5 h-5" />, badge: allIssues.filter(i => i.status === "Waiting For Materials").length },
    { id: "verify", label: "Verification", icon: <Shield className="w-5 h-5" />, badge: allIssues.filter(i => i.status === "Ready For Verification").length },
    { id: "resolved", label: "Resolved", icon: <CheckCircle2 className="w-5 h-5" />, badge: resolvedIssues.length },
    { id: "employees", label: "Employees", icon: <UsersRound className="w-5 h-5" />, badge: employees.length },
  ];

  return (
    <div className="flex h-[100dvh] bg-surface-50 font-sans overflow-hidden">

      {/* ─── SIDEBAR ─── */}
      <aside className="w-64 bg-surface-900 text-white flex flex-col shadow-float flex-shrink-0 z-20">
        <div className="p-6 border-b border-surface-800">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-inner-soft">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight leading-tight">Admin Portal</h1>
              <p className="text-primary-200 text-xs font-medium">{appUser.city || appUser.state || "Community Hero"}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold transition-all text-sm ${
                activeTab === item.id
                  ? "bg-primary-600 text-white shadow-md shadow-primary-900/50"
                  : "text-surface-300 hover:bg-surface-800 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-3">{item.icon}{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === item.id ? "bg-white/20 text-white" : "bg-surface-800 text-surface-400"}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-5 border-t border-surface-800 space-y-3">
          <div className="bg-surface-800 rounded-2xl p-4 border border-surface-700">
            <p className="font-bold text-sm truncate text-white">{appUser.name}</p>
            <p className="text-[11px] text-surface-400 truncate mb-2">{appUser.department || "Administrator"}</p>
            <div className="flex items-center gap-2 bg-surface-900 px-3 py-1.5 rounded-lg border border-surface-700 w-max">
              <div className={`w-2 h-2 rounded-full ${isOnDuty ? "bg-success-400 animate-pulse" : "bg-surface-500"}`} />
              <span className="text-[10px] font-bold tracking-wider uppercase text-surface-300">{isOnDuty ? "On Duty" : "Off Duty"}</span>
            </div>
          </div>
          <button onClick={handleToggleAdminStatus} className={`w-full flex items-center gap-2 justify-center py-3 rounded-2xl text-sm font-bold transition-all border-2 ${isOnDuty ? "border-success-500/30 bg-success-500/10 text-success-400 hover:bg-success-500/20" : "border-surface-700 bg-surface-800 text-surface-400 hover:bg-surface-700"}`}>
            <Power className="w-4 h-4" /> {isOnDuty ? "Go Off Duty" : "Go On Duty"}
          </button>
          <button onClick={() => setIsPasswordModalOpen(true)} className="w-full flex items-center gap-2 justify-center py-3 rounded-2xl text-sm font-medium text-surface-400 hover:bg-surface-800 hover:text-white transition-colors">
            <Shield className="w-4 h-4" /> Change Password
          </button>
          <button onClick={logoutMock} className="w-full flex items-center gap-2 justify-center py-3 rounded-2xl text-sm font-medium text-error-400 hover:bg-error-500/10 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 h-full overflow-y-auto bg-surface-50 animate-fade-in pb-[150px]">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">

          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-black text-surface-900 tracking-tight">
                {activeTab === "home" && "Dashboard Overview"}
                {activeTab === "live" && "Live Reports"}
                {activeTab === "resolved" && "Resolved Reports"}
                {activeTab === "employees" && "Employee Management"}
              </h2>
              <p className="text-surface-500 text-sm font-medium mt-1">
                <span className="text-primary-600">{appUser.department}</span> · {appUser.city ? `${appUser.city}, ` : ""}{appUser.state}
              </p>
            </div>
            <Button variant="secondary" onClick={loadAll} disabled={isRefreshing} icon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />}>
              Refresh
            </Button>
          </div>

          {/* ════ OVERVIEW TAB ════ */}
          {activeTab === "home" && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Open Issues", value: kpi.open, icon: <FileText className="w-6 h-6" />, color: "info", bg: "bg-info-50", text: "text-info-600", border: "border-info-200", sub: "Awaiting action" },
                  { label: "In Progress", value: kpi.inProgress, icon: <TrendingUp className="w-6 h-6" />, color: "warning", bg: "bg-warning-50", text: "text-warning-600", border: "border-warning-200", sub: "Being worked on" },
                  { label: "Resolved", value: kpi.resolved, icon: <CheckCircle2 className="w-6 h-6" />, color: "success", bg: "bg-success-50", text: "text-success-600", border: "border-success-200", sub: "Completed" },
                  { label: "Escalated", value: kpi.escalated, icon: <AlertTriangle className="w-6 h-6" />, color: "error", bg: "bg-error-50", text: "text-error-600", border: "border-error-200", sub: "Over 7 days old" },
                ].map(({ label, value, icon, bg, text, border, sub }) => (
                  <Card key={label} className={`border shadow-sm bg-white ${border}`}>
                    <CardContent className="p-5">
                      <div className={`w-12 h-12 ${bg} ${text} rounded-2xl flex items-center justify-center mb-4`}>{icon}</div>
                      <p className="text-4xl font-black text-surface-900 tracking-tight">{value}</p>
                      <p className="text-sm font-bold text-surface-500 mt-1 uppercase tracking-wider">{label}</p>
                      <p className="text-[10px] text-surface-400 mt-1 font-medium">{sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Issues */}
              <Card className="border-surface-200">
                <CardHeader className="border-b border-surface-100 pb-4 flex items-center justify-between">
                  <h3 className="font-black text-surface-900 flex items-center gap-2"><Activity className="w-5 h-5 text-primary-600" /> Recent Issues</h3>
                  <button onClick={() => setActiveTab("live")} className="text-primary-600 text-sm font-bold hover:underline">View all →</button>
                </CardHeader>
                <div className="divide-y divide-surface-100 bg-surface-50/50">
                  {allIssues.slice(0, 5).map(issue => (
                    <div key={issue.id} className="flex items-center gap-4 p-5 hover:bg-white transition-colors cursor-pointer" onClick={() => { setActiveTab("live"); setExpandedIssueId(issue.id); }}>
                      {issue.imageBase64 && <img src={issue.imageBase64} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-surface-200 shadow-sm" alt="" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-[10px] font-bold text-surface-500 bg-surface-100 px-2 py-1 rounded-md">{issue.id}</span>
                          <StatusBadge status={issue.status} />
                        </div>
                        <p className="text-sm font-bold text-surface-900 truncate">{issue.aiAnalysis.category}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 flex-shrink-0">{new Date(issue.timestamp).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {allIssues.length === 0 && (
                    <div className="p-12 text-center bg-white">
                      <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckSquare className="w-8 h-8 text-surface-300" />
                      </div>
                      <p className="text-surface-500 font-medium">No issues in your jurisdiction yet</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Quick Employee Overview */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-purple-600" /> Your Team ({employees.length})</h3>
                  <button onClick={() => setActiveTab("employees")} className="text-purple-600 text-sm font-bold hover:underline">Manage →</button>
                </div>
                <div className="p-5">
                  {employees.length === 0 ? (
                    <div className="text-center py-6">
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">No employees yet. <button onClick={() => setActiveTab("employees")} className="text-purple-600 font-bold">Add one →</button></p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {employees.slice(0, 6).map(emp => (
                        <div key={emp.email} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                          <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm">{emp.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">{emp.name}</p>
                            <div className="flex items-center gap-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${emp.isAvailable !== false ? "bg-green-400" : "bg-slate-400"}`} />
                              <p className="text-[11px] text-slate-400">{emp.isAvailable !== false ? "On Duty" : "Off Duty"}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════ LIVE REPORTS TAB ════ */}
          {activeTab === "live" && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by ID, description, category…" className="w-full border-2 border-surface-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium bg-white focus:border-primary-500 focus:outline-none shadow-sm transition-colors placeholder:text-surface-400" />
                </div>
                <div className="flex items-center gap-2 bg-white border-2 border-surface-200 rounded-2xl px-5 shadow-sm">
                  <span className="text-sm font-black text-surface-600 uppercase tracking-wider">{filteredLive.length} issues</span>
                </div>
              </div>

              {filteredLive.length === 0 ? (
                <Card className="border-surface-200 p-16 text-center">
                  <div className="w-20 h-20 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-success-500" />
                  </div>
                  <h3 className="font-black text-surface-900 text-2xl mb-2">All Clear!</h3>
                  <p className="text-surface-500 font-medium">No live issues in your jurisdiction.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredLive.map(issue => <IssueCard key={issue.id} issue={issue} />)}
                </div>
              )}
            </div>
          )}

          {/* ════ RESOLVED REPORTS TAB ════ */}
          {activeTab === "resolved" && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search resolved issues…" className="w-full border-2 border-surface-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium bg-white focus:border-primary-500 focus:outline-none shadow-sm transition-colors placeholder:text-surface-400" />
                </div>
                <div className="flex items-center gap-2 bg-white border-2 border-surface-200 rounded-2xl px-5 shadow-sm">
                  <span className="text-sm font-black text-surface-600 uppercase tracking-wider">{filteredResolved.length} resolved</span>
                </div>
              </div>

              {filteredResolved.length === 0 ? (
                <Card className="border-surface-200 p-16 text-center">
                  <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-surface-400" />
                  </div>
                  <h3 className="font-black text-surface-900 text-2xl mb-2">No resolved issues yet</h3>
                  <p className="text-surface-500 font-medium">Resolved and closed issues will appear here.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredResolved.map(issue => <IssueCard key={issue.id} issue={issue} showActions={false} />)}
                </div>
              )}
            </div>
          )}

          {/* ════ MATERIAL REQUESTS TAB ════ */}
          {activeTab === "materials" && (() => {
            const materialIssues = allIssues.filter(i => i.status === "Waiting For Materials");
            return (
              <div className="space-y-6">
                <Card className="border-surface-200">
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                          <PackageSearch className="w-5 h-5 text-primary-600" />
                        </div>
                        <span className="font-black text-surface-900 text-lg">Pending Material Requests</span>
                      </div>
                      <span className="text-sm font-black text-surface-500 uppercase tracking-wider">{materialIssues.length} issues</span>
                    </div>
                  </CardHeader>
                </Card>

                {materialIssues.length === 0 ? (
                  <Card className="border-surface-200 p-16 text-center">
                    <div className="w-20 h-20 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-success-500" />
                    </div>
                    <h3 className="font-black text-surface-900 text-2xl mb-2">All Clear!</h3>
                    <p className="text-surface-500 font-medium">No pending material requests.</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {materialIssues.map(issue => (
                      <Card key={issue.id} className="border-surface-200 overflow-hidden">
                        <div className="flex justify-between items-start p-6 bg-surface-50 border-b border-surface-200">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-surface-500 bg-white border border-surface-200 shadow-sm px-2 py-1 rounded-md mr-3">{issue.id}</span>
                            <h3 className="font-black text-surface-900 text-xl inline">{issue.aiAnalysis.category}</h3>
                          </div>
                          <Button variant="primary" onClick={() => handleStatusUpdate(issue.id, "Material Approved", "Materials Approved & Dispatched")}>
                            Approve & Dispatch
                          </Button>
                        </div>
                        <CardContent className="p-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-warning-50 border border-warning-200 rounded-2xl p-5 shadow-sm">
                              <h4 className="text-sm font-black text-warning-800 mb-3 uppercase tracking-wider">Request Details</h4>
                              <p className="text-sm text-surface-800 font-medium whitespace-pre-wrap">{issue.description || "Awaiting materials to proceed."}</p>
                              <div className="mt-4 pt-4 border-t border-warning-200">
                                <p className="text-xs text-warning-700 font-bold">Requested by: <span className="text-warning-900">{issue.assignedTo}</span></p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ════ VERIFICATION CENTER TAB ════ */}
          {activeTab === "verify" && (() => {
            const verifyIssues = allIssues.filter(i => i.status === "Ready For Verification" || i.status === "Awaiting Admin Verification");
            return (
              <div className="space-y-6">
                <Card className="border-surface-200">
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                          <Shield className="w-5 h-5 text-primary-600" />
                        </div>
                        <span className="font-black text-surface-900 text-lg">Verification Center</span>
                      </div>
                      <span className="text-sm font-black text-surface-500 uppercase tracking-wider">{verifyIssues.length} pending</span>
                    </div>
                  </CardHeader>
                </Card>

                {verifyIssues.length === 0 ? (
                  <Card className="border-surface-200 p-16 text-center">
                    <div className="w-20 h-20 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-success-500" />
                    </div>
                    <h3 className="font-black text-surface-900 text-2xl mb-2">Queue Empty</h3>
                    <p className="text-surface-500 font-medium">No issues awaiting verification.</p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {verifyIssues.map(issue => (
                      <Card key={issue.id} className="border-surface-200 overflow-hidden">
                        <div className="p-6 border-b border-surface-200 flex justify-between items-start bg-surface-50/50">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-surface-500 bg-white border border-surface-200 shadow-sm px-2 py-1 rounded-md mr-3">{issue.id}</span>
                            <h3 className="font-black text-surface-900 text-xl inline">{issue.aiAnalysis.category}</h3>
                            <p className="text-sm text-surface-500 mt-2 font-medium flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary-500" /> {issue.address}</p>
                          </div>
                          <div className="flex gap-3">
                            <Button variant="primary" onClick={() => handleStatusUpdate(issue.id, "Completed", "Admin Verified & Completed")} icon={<CheckCircle2 className="w-4 h-4" />}>
                              Approve & Complete
                            </Button>
                            <Button variant="danger" onClick={() => handleStatusUpdate(issue.id, "Work In Progress", "Verification Rejected - Rework Required")}>
                              Reject (Rework)
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-6 grid md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="text-xs font-black text-surface-500 mb-3 uppercase tracking-wider flex items-center gap-2">Original Report</h4>
                            {issue.imageBase64 && <img src={issue.imageBase64} className="w-full h-56 object-cover rounded-2xl border-2 border-surface-200 shadow-sm" alt="Original" />}
                            <div className="mt-4 bg-surface-50 rounded-xl p-4 border border-surface-200 shadow-inner-soft">
                              <p className="text-sm text-surface-800 font-medium">{issue.description}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-success-600 mb-3 uppercase tracking-wider flex items-center gap-2">Resolution Proof</h4>
                            {(issue.evidences && issue.evidences.length > 0) ? (
                              <>
                                <img src={issue.evidences[issue.evidences.length - 1].url} className="w-full h-56 object-cover rounded-2xl border-4 border-success-400 shadow-sm" alt="Resolution" />
                                <div className="mt-4 bg-success-50 rounded-xl p-4 border border-success-200 shadow-inner-soft text-sm text-success-900">
                                  <span className="font-black uppercase tracking-wider text-[10px] block mb-1 text-success-700">Employee Notes:</span>
                                  {issue.evidences[issue.evidences.length - 1].caption || "No notes provided."}
                                </div>
                              </>
                            ) : issue.resolutionProof ? (
                              <>
                                <img src={issue.resolutionProof.imageBase64} className="w-full h-56 object-cover rounded-2xl border-4 border-success-400 shadow-sm" alt="Resolution" />
                                <div className="mt-4 bg-success-50 rounded-xl p-4 border border-success-200 shadow-inner-soft text-sm text-success-900">
                                  <span className="font-black uppercase tracking-wider text-[10px] block mb-1 text-success-700">Employee Notes:</span>
                                  {issue.resolutionProof.notes}
                                </div>
                              </>
                            ) : (
                              <div className="h-56 border-2 border-dashed border-surface-300 rounded-2xl flex items-center justify-center text-surface-400 font-medium">No proof submitted</div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ════ EMPLOYEES TAB ════ */}
          {activeTab === "employees" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Employee Roster */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-surface-200">
                  <CardHeader className="py-4 border-b border-surface-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary-600" />
                        </div>
                        <span className="font-black text-surface-900 text-lg">Current Roster</span>
                      </div>
                      <span className="text-sm font-black text-surface-500 uppercase tracking-wider">{employees.length} staff</span>
                    </div>
                  </CardHeader>
                  
                  {employees.length === 0 ? (
                    <CardContent className="p-16 text-center">
                      <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="w-10 h-10 text-surface-400" />
                      </div>
                      <h3 className="font-black text-surface-900 text-2xl mb-2">No employees added yet</h3>
                      <p className="text-surface-500 font-medium">Use the form on the right to add your first employee.</p>
                    </CardContent>
                  ) : (
                    <div className="divide-y divide-surface-100">
                      {employees.map(emp => (
                        <div key={emp.email} className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 hover:bg-surface-50 transition-colors">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-info-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-inner-soft flex-shrink-0">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-surface-900 text-lg leading-tight">{emp.name}</p>
                            <p className="text-sm text-surface-500 truncate mb-1">{emp.email}</p>
                            <span className="inline-block px-2.5 py-1 bg-surface-100 text-surface-600 text-[10px] font-bold uppercase tracking-wider rounded-md">{emp.department || appUser.department}</span>
                          </div>
                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 mt-2 sm:mt-0">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${emp.isAvailable !== false ? "bg-success-100 text-success-700 border border-success-200" : "bg-surface-100 text-surface-500 border border-surface-200"}`}>
                              {emp.isAvailable !== false ? "● On Duty" : "○ Off Duty"}
                            </span>
                            <span className="text-[11px] font-bold text-surface-400">{emp.city || "—"}, {emp.state || "—"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Add Employee + Jurisdiction Info */}
              <div className="space-y-6">
                {/* Jurisdiction Card */}
                <Card className="border-surface-200">
                  <CardHeader className="pb-4">
                    <h3 className="font-black text-surface-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary-600" /> Your Jurisdiction
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-surface-100"><span className="text-surface-500 font-bold uppercase tracking-wider text-[10px]">State</span><span className="font-black text-surface-900">{appUser.state || "—"}</span></div>
                    <div className="flex justify-between items-center py-2 border-b border-surface-100"><span className="text-surface-500 font-bold uppercase tracking-wider text-[10px]">City</span><span className="font-black text-surface-900">{appUser.city || "Entire State"}</span></div>
                    <div className="flex justify-between items-center py-2"><span className="text-surface-500 font-bold uppercase tracking-wider text-[10px]">Department</span><span className="font-black text-primary-700">{appUser.department || "All Depts"}</span></div>
                  </CardContent>
                </Card>

                {/* Add Employee Form */}
                <Card className="border-primary-200 bg-primary-50/30">
                  <CardHeader className="pb-4 border-b border-primary-100">
                    <h3 className="font-black text-primary-900 flex items-center gap-2">
                      <Plus className="w-5 h-5" /> Add Employee
                    </h3>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <form onSubmit={handleCreateEmployee} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-surface-600 uppercase tracking-wider mb-1.5">Full Name</label>
                        <input type="text" required value={newEmpName} onChange={e => setNewEmpName(e.target.value)} placeholder="e.g. John Doe" className="w-full border-2 border-surface-200 bg-white rounded-xl px-4 py-3 text-sm focus:border-primary-500 focus:outline-none transition-colors placeholder:text-surface-400" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-surface-600 uppercase tracking-wider mb-1.5">Login Email</label>
                        <input type="email" required value={newEmpEmail} onChange={e => setNewEmpEmail(e.target.value)} placeholder="employee@example.com" className="w-full border-2 border-surface-200 bg-white rounded-xl px-4 py-3 text-sm focus:border-primary-500 focus:outline-none transition-colors placeholder:text-surface-400" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-surface-600 uppercase tracking-wider mb-1.5">Initial Password</label>
                        <input type="text" required value={newEmpPassword} onChange={e => setNewEmpPassword(e.target.value)} placeholder="Set a secure password" className="w-full border-2 border-surface-200 bg-white rounded-xl px-4 py-3 text-sm focus:border-primary-500 focus:outline-none transition-colors placeholder:text-surface-400" />
                      </div>
                      {empFormMsg && (
                        <div className={`text-xs font-bold px-4 py-3 rounded-xl border ${empFormMsg.type === "success" ? "bg-success-50 text-success-700 border-success-200" : "bg-error-50 text-error-700 border-error-200"}`}>
                          {empFormMsg.text}
                        </div>
                      )}
                      <Button type="submit" variant="primary" className="w-full">
                        Create Account
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── CHANGE PASSWORD MODAL ─── */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Change Password</h2>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input type="password" required value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} placeholder="New password" className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900" />
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors">Update Password</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
