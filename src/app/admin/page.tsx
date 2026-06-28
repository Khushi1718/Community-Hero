"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  LogOut, LayoutDashboard, CheckCircle2, Clock, MapPin, AlertTriangle,
  UploadCloud, Search, Activity, Shield, Users, Power, FolderKanban,
  UsersRound, X, ChevronDown, ChevronUp, Send, Eye, Briefcase,
  TrendingUp, FileText, UserCheck, AlertCircle, RefreshCw, Plus, CheckSquare, PackageSearch,
  Calendar, PieChart, BarChart2, Award
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { IssueStatus, AppUser, saveUser } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";

interface Issue {
  id: string;
  issueId?: string;
  _id?: string;
  citizenEmail: string;
  imageBase64: string;
  description: string;
  location: string;
  state?: string;
  city?: string;
  address?: string;
  timestamp: number;
  aiAnalysis: { category: string; severity: string; severityReason?: string; department: string; trust: any; reasoningPoints: string[] };
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
  resolutionVerification?: { isResolved: boolean; confidence: number; reasoning: string; };
  citizenFeedback?: { rating: number; comment: string };
  verificationScore?: number;
  cameraSource?: string;
  deviceInfo?: string;
  browserInfo?: string;
  evidences?: { url: string; type?: string; category?: string; caption?: string; isPublic?: boolean }[];
  materialRequests?: any[];
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

  type Tab = "home" | "live" | "resolved" | "materials" | "verify" | "employees" | "volunteer_orgs" | "community_drives" | "certificates" | "analytics" | "leaderboard" | "area_adoptions" | "audit_logs" | "health" | "heatmap";
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [employees, setEmployees] = useState<AppUser[]>([]);
  const [kpi, setKpi] = useState({ open: 0, inProgress: 0, resolved: 0, escalated: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Volunteer Orgs
  const [orgs, setOrgs] = useState<any[]>([]);
  const [orgSubTab, setOrgSubTab] = useState<"pending" | "verified" | "rejected" | "create">("pending");
  const [orgActionId, setOrgActionId] = useState<string | null>(null);
  const [orgActionType, setOrgActionType] = useState<"approve" | "reject" | "info" | "suspend" | "view" | null>(null);
  const [orgActionMessage, setOrgActionMessage] = useState("");
  const [orgActionLoading, setOrgActionLoading] = useState(false);
  const [createdOrgCredentials, setCreatedOrgCredentials] = useState<{username: string, password: string} | null>(null);

  // Community Drives
  const [drives, setDrives] = useState<any[]>([]);
  const [drivesSubTab, setDrivesSubTab] = useState<"active" | "requests" | "verification" | "cancellations">("active");
  const [convertingIssue, setConvertingIssue] = useState<Issue | null>(null);
  
  // Certificates
  const [certificates, setCertificates] = useState<any[]>([]);
  
  // Convert Drive Form State
  const [driveTitle, setDriveTitle] = useState("");
  const [driveDescription, setDriveDescription] = useState("");
  const [driveCategory, setDriveCategory] = useState("Cleanliness");
  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [driveInstructions, setDriveInstructions] = useState("");
  const [driveReqOrgCat, setDriveReqOrgCat] = useState("Cleanliness");
  const [convertingLoading, setConvertingLoading] = useState(false);

  // Prompt 4B States
  const [healthData, setHealthData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [adoptedAreas, setAdoptedAreas] = useState<any[]>([]);

  // Issue detail expansion
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);

  // Assignment
  const [assigningIssueId, setAssigningIssueId] = useState<string | null>(null);
  const [selectedWorkerEmail, setSelectedWorkerEmail] = useState("");

  // Resolution proof upload (admin can also resolve)
  const [resolvingIssueId, setResolvingIssueId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolutionImageBase64, setResolutionImageBase64] = useState("");

  // AI Verification Override
  const [overrideIssueId, setOverrideIssueId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

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
      await Promise.all([loadIssues(), loadEmployees(), loadOrgs(), loadDrives(), loadCertificates(), loadAnalytics(), loadExtraData()]);
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
      resolved: merged.filter(i => ["Closed", "Resolved", "Completed", "Awaiting Citizen Review"].includes(i.status)).length,
      escalated: merged.filter(i => !["Closed", "Resolved", "Completed", "Rejected"].includes(i.status) && Date.now() - i.timestamp > SEVEN_DAYS).length,
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

  const loadOrgs = async () => {
    if (!appUser) return;
    const params = new URLSearchParams();
    if (appUser.city) params.append("city", appUser.city);
    const res = await fetch(`/api/volunteer-org?${params}`).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      setOrgs(Array.isArray(data) ? data : []);
    }
  };

  const loadDrives = async () => {
    if (!appUser) return;
    const params = new URLSearchParams();
    if (appUser.city) params.append("city", appUser.city);
    const res = await fetch(`/api/community-drives?${params}`).catch(() => null);
    if (res && res.ok) {
      const drivesData = await res.json();
      setDrives(Array.isArray(drivesData) ? drivesData : []);
    }
  };

  const loadCertificates = async () => {
    const res = await fetch("/api/certificates").catch(() => null);
    if (res && res.ok) setCertificates(await res.json());
  };

  const loadAnalytics = async () => {
    try {
      const [analyticsRes, leaderboardRes] = await Promise.all([
         fetch("/api/analytics/admin"),
         fetch("/api/leaderboard?category=volunteers&timeFilter=all_time")
      ]);
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (leaderboardRes.ok) {
         const data = await leaderboardRes.json();
         setLeaderboard(data.leaderboard || []);
      }
    } catch { /* silently fail */ }
  };

  const loadExtraData = async () => {
    try {
      const [healthRes, auditRes, areasRes] = await Promise.all([
        fetch("/api/health-monitor", { headers: { "x-user-role": "admin" } }),
        fetch("/api/audit", { headers: { "x-user-role": "admin" } }),
        fetch("/api/adopted-areas")
      ]);
      if (healthRes.ok) setHealthData(await healthRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
      if (areasRes.ok) setAdoptedAreas(await areasRes.json());
    } catch { /* silently fail */ }
  };

  const handleRefresh = () => loadAll();

  const handleOrgAction = async (orgId: string, action: string, message?: string) => {
    if (!appUser) return;
    setOrgActionLoading(true);
    try {
      await fetch(`/api/volunteer-org/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          actorEmail: appUser.email,
          actorName: appUser.name,
          actorRole: "admin",
          message: message || undefined,
        }),
      });
      setOrgActionId(null);
      setOrgActionType(null);
      setOrgActionMessage("");
      await loadOrgs();
    } finally {
      setOrgActionLoading(false);
    }
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
  const liveIssues = allIssues.filter(i => !["Closed", "Resolved", "Completed", "Rejected"].includes(i.status));
  const resolvedIssues = allIssues.filter(i => ["Closed", "Resolved", "Completed", "Awaiting Citizen Review"].includes(i.status));

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
    const isEscalated = !["Closed", "Resolved", "Completed", "Rejected"].includes(issue.status) && Date.now() - issue.timestamp > SEVEN_DAYS;
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

            {/* AI Severity Analysis */}
            {issue.aiAnalysis?.severityReason && (
              <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 shadow-sm">
                <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> AI Severity Analysis: {issue.aiAnalysis.severity}
                </h4>
                <p className="text-sm text-red-900 font-medium bg-white p-3 rounded-lg border border-red-100 shadow-inner-soft">
                  <span className="font-black uppercase tracking-wider text-[10px] block mb-1 text-red-500">Reason</span>
                  {issue.aiAnalysis.severityReason}
                </p>
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
            {showActions && !["Closed", "Resolved", "Completed", "Rejected"].includes(issue.status) && (
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

                {/* Prompt 2: Convert to Community Drive */}
                {issue.status === "Community Drive Active" ? (
                  <span className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl text-sm font-bold">
                    <Activity className="w-4 h-4" /> Drive Active
                  </span>
                ) : (
                  <button 
                    onClick={() => {
                      setConvertingIssue(issue);
                      setDriveTitle(issue.aiAnalysis?.category ? issue.aiAnalysis.category + " Drive" : "");
                      setDriveDescription(issue.description || "");
                    }} 
                    disabled={["Work In Progress", "Travelling", "Reached Site", "Inspection Started", "Work Started"].includes(issue.status)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${
                      ["Work In Progress", "Travelling", "Reached Site", "Inspection Started", "Work Started"].includes(issue.status)
                        ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-50"
                        : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                    }`}
                    title={["Work In Progress", "Travelling", "Reached Site", "Inspection Started", "Work Started"].includes(issue.status) ? "Employee already started work" : ""}
                  >
                    <Users className="w-4 h-4" /> Convert to Community Drive
                  </button>
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
    { id: "volunteer_orgs", label: "Organizations", icon: <Briefcase className="w-5 h-5" />, badge: orgs.filter((o: any) => o.status === "PENDING_VERIFICATION").length },
    { id: "community_drives", label: "Community Drives", icon: <Activity className="w-5 h-5" />, badge: drives.length },
    { id: "certificates", label: "Certificates", icon: <Award className="w-5 h-5" /> },
    { id: "area_adoptions", label: "Area Adoptions", icon: <MapPin className="w-5 h-5" /> },
    { id: "analytics", label: "Platform Analytics", icon: <PieChart className="w-5 h-5" /> },
    { id: "heatmap", label: "Issue Heatmap", icon: <MapPin className="w-5 h-5" /> },
    { id: "leaderboard", label: "Global Leaderboard", icon: <BarChart2 className="w-5 h-5" /> },
    { id: "audit_logs", label: "Audit Logs", icon: <FileText className="w-5 h-5" /> },
    { id: "health", label: "Platform Health", icon: <Activity className="w-5 h-5" /> },
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
                {activeTab === "volunteer_orgs" && "Volunteer Organizations"}
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
                              {issue.materialRequests && issue.materialRequests.length > 0 ? (
                                (() => {
                                  const req = issue.materialRequests[issue.materialRequests.length - 1];
                                  return (
                                    <div className="space-y-2">
                                      <p className="text-sm text-surface-800"><span className="font-bold">Material:</span> {req.material}</p>
                                      <p className="text-sm text-surface-800"><span className="font-bold">Quantity:</span> {req.quantity}</p>
                                      <p className="text-sm text-surface-800"><span className="font-bold">Reason:</span> {req.reason}</p>
                                    </div>
                                  );
                                })()
                              ) : (
                                <p className="text-sm text-surface-800 font-medium whitespace-pre-wrap">{issue.description || "Awaiting materials to proceed."}</p>
                              )}
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
                          <div className="flex gap-3 w-full md:w-auto">
                            {overrideIssueId === issue.id ? (
                              <div className="flex gap-2 items-center flex-1 w-full bg-white p-2 rounded-xl border border-red-200 shadow-sm">
                                <AlertTriangle className="w-5 h-5 text-red-500 ml-2" />
                                <input 
                                   type="text" 
                                   placeholder="Reason for overriding AI..." 
                                   value={overrideReason}
                                   onChange={e => setOverrideReason(e.target.value)}
                                   className="border-none bg-transparent focus:ring-0 text-sm flex-1"
                                />
                                <Button 
                                   variant="primary" 
                                   disabled={!overrideReason.trim()}
                                   onClick={() => {
                                     handleStatusUpdate(issue.id, "Completed", "Admin Verified (AI Override) - Reason: " + overrideReason);
                                     setOverrideIssueId(null);
                                     setOverrideReason("");
                                   }}
                                >
                                  Confirm
                                </Button>
                                <button onClick={() => { setOverrideIssueId(null); setOverrideReason(""); }} className="text-surface-500 text-sm hover:underline px-2">Cancel</button>
                              </div>
                            ) : (
                              <>
                                <Button variant="primary" onClick={() => {
                                   if (issue.resolutionVerification && !issue.resolutionVerification.isResolved) {
                                     setOverrideIssueId(issue.id);
                                   } else {
                                     handleStatusUpdate(issue.id, "Completed", "Admin Verified & Completed")
                                   }
                                }} icon={<CheckCircle2 className="w-4 h-4" />}>
                                  Approve & Complete
                                </Button>
                                <Button variant="danger" onClick={() => handleStatusUpdate(issue.id, "Work In Progress", "Verification Rejected - Rework Required")}>
                                  Reject (Rework)
                                </Button>
                              </>
                            )}
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
                        {issue.resolutionVerification && (
                          <div className="bg-indigo-50/50 border-t border-b border-indigo-100 p-6">
                            <h4 className="text-sm font-black text-indigo-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                              <Shield className="w-5 h-5 text-indigo-600" /> AI Resolution Verification
                            </h4>
                            <div className="flex flex-col md:flex-row gap-4 items-start">
                              <div className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 w-32 shrink-0 ${issue.resolutionVerification.isResolved ? "bg-success-50 border-success-200 text-success-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                                <span className="text-3xl font-black">{issue.resolutionVerification.confidence}%</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider mt-1 text-center">Confidence</span>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex-1">
                                <p className="text-sm text-indigo-950 font-medium">
                                  {issue.resolutionVerification.reasoning}
                                </p>
                                <div className="mt-3 pt-3 border-t border-indigo-50 flex items-center gap-2">
                                  {issue.resolutionVerification.isResolved ? (
                                    <span className="flex items-center gap-1 text-success-600 font-bold text-sm"><CheckCircle2 className="w-4 h-4" /> AI Confirms Resolved</span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-red-600 font-bold text-sm"><X className="w-4 h-4" /> AI Does Not Confirm Resolution</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
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

          {/* ════ VOLUNTEER ORGANIZATIONS TAB ════ */}
          {activeTab === "volunteer_orgs" && (() => {
            const pendingOrgs = orgs.filter((o: any) => o.status === "PENDING_VERIFICATION");
            const verifiedOrgs = orgs.filter((o: any) => o.status === "VERIFIED");
            const rejectedOrgs = orgs.filter((o: any) => o.status === "REJECTED" || o.status === "SUSPENDED");
            const displayOrgs = orgSubTab === "pending" ? pendingOrgs : orgSubTab === "verified" ? verifiedOrgs : rejectedOrgs;

            return (
              <div className="space-y-6">
                {/* Sub-tabs */}
                <div className="flex gap-2 flex-wrap mb-4">
                  {(["pending", "verified", "rejected", "create"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setOrgSubTab(tab)}
                      className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all capitalize ${
                        orgSubTab === tab
                          ? "bg-primary-600 text-white"
                          : "bg-white border border-surface-200 text-surface-600 hover:bg-surface-50"
                      }`}
                    >
                      {tab === "pending" ? `Pending (${pendingOrgs.length})` :
                        tab === "verified" ? `Verified (${verifiedOrgs.length})` :
                        tab === "rejected" ? `Rejected/Suspended (${rejectedOrgs.length})` : 
                        "Create Organization"}
                    </button>
                  ))}
                </div>

                {orgSubTab === "create" ? (
                   <Card className="border-surface-200 shadow-sm max-w-2xl">
                     <CardHeader className="border-b border-surface-100 bg-surface-50 p-6">
                       <h3 className="font-black text-surface-900 text-xl flex items-center gap-2">
                         <Plus className="w-5 h-5 text-primary-600" /> Create Verified Organization
                       </h3>
                       <p className="text-sm text-surface-500 mt-1">Directly onboard an NGO, NSS unit, or community group. They will receive temporary credentials.</p>
                     </CardHeader>
                     <CardContent className="p-6">
                       <form onSubmit={async (e) => {
                         e.preventDefault();
                         const formData = new FormData(e.currentTarget);
                         setOrgActionLoading(true);
                         try {
                           const res = await fetch("/api/volunteer-org", {
                             method: "POST",
                             headers: { "Content-Type": "application/json" },
                             body: JSON.stringify({
                               createdByAdmin: true,
                               adminEmail: appUser.email,
                               adminName: appUser.name,
                               adminRole: role,
                               name: formData.get("name"),
                               type: formData.get("type"),
                               description: formData.get("description"),
                               city: appUser.city || formData.get("city"),
                               state: appUser.state || formData.get("state"),
                               address: formData.get("address"),
                               contactPersonName: formData.get("contactPersonName"),
                               contactEmail: formData.get("contactEmail"),
                               contactPhone: formData.get("contactPhone"),
                               activeMembers: Number(formData.get("activeMembers")),
                               workCategories: [formData.get("workCategory")],
                               password: Math.random().toString(36).slice(-8) + "A1!"
                             })
                           });
                           if (res.ok) {
                             const data = await res.json();
                             setCreatedOrgCredentials({ username: data.username, password: data.password });
                             loadOrgs();
                             e.currentTarget.reset();
                           } else {
                             const err = await res.json();
                             alert(err.error);
                           }
                         } finally {
                           setOrgActionLoading(false);
                         }
                       }} className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="block text-xs font-bold text-surface-600 mb-1">Organization Name</label>
                             <input name="name" required className="w-full border p-2 rounded-xl text-sm" />
                           </div>
                           <div>
                             <label className="block text-xs font-bold text-surface-600 mb-1">Type</label>
                             <select name="type" className="w-full border p-2 rounded-xl text-sm">
                               <option value="NGO">NGO</option>
                               <option value="NSS Unit">NSS Unit</option>
                               <option value="RWA">RWA</option>
                               <option value="Youth Club">Youth Club</option>
                             </select>
                           </div>
                           <div className="col-span-2">
                             <label className="block text-xs font-bold text-surface-600 mb-1">Description</label>
                             <textarea name="description" required rows={2} className="w-full border p-2 rounded-xl text-sm resize-none"></textarea>
                           </div>
                           <div>
                             <label className="block text-xs font-bold text-surface-600 mb-1">Contact Email (Login ID)</label>
                             <input name="contactEmail" type="email" required className="w-full border p-2 rounded-xl text-sm" />
                           </div>
                           <div>
                             <label className="block text-xs font-bold text-surface-600 mb-1">Contact Phone</label>
                             <input name="contactPhone" required className="w-full border p-2 rounded-xl text-sm" />
                           </div>
                           <div>
                             <label className="block text-xs font-bold text-surface-600 mb-1">Contact Person Name</label>
                             <input name="contactPersonName" required className="w-full border p-2 rounded-xl text-sm" />
                           </div>
                           <div>
                             <label className="block text-xs font-bold text-surface-600 mb-1">Primary Category</label>
                             <select name="workCategory" className="w-full border p-2 rounded-xl text-sm">
                               <option>Cleanliness</option>
                               <option>Tree Plantation</option>
                               <option>Awareness Campaign</option>
                               <option>Waste Segregation</option>
                             </select>
                           </div>
                           <div className="col-span-2">
                             <label className="block text-xs font-bold text-surface-600 mb-1">Address</label>
                             <input name="address" required className="w-full border p-2 rounded-xl text-sm" />
                           </div>
                           {!appUser.city && (
                             <>
                               <div><label className="block text-xs font-bold text-surface-600 mb-1">City</label><input name="city" required className="w-full border p-2 rounded-xl text-sm" /></div>
                               <div><label className="block text-xs font-bold text-surface-600 mb-1">State</label><input name="state" required className="w-full border p-2 rounded-xl text-sm" /></div>
                             </>
                           )}
                           <div>
                             <label className="block text-xs font-bold text-surface-600 mb-1">Active Members</label>
                             <input name="activeMembers" type="number" required defaultValue="10" className="w-full border p-2 rounded-xl text-sm" />
                           </div>
                         </div>
                         <Button type="submit" variant="primary" className="w-full mt-4" disabled={orgActionLoading}>
                           {orgActionLoading ? "Creating..." : "Create Organization"}
                         </Button>
                       </form>
                     </CardContent>
                   </Card>
                ) : displayOrgs.length === 0 ? (
                  <Card className="border-surface-200 p-16 text-center">
                    <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Briefcase className="w-10 h-10 text-surface-400" />
                    </div>
                    <h3 className="font-black text-surface-900 text-2xl mb-2">No Organizations</h3>
                    <p className="text-surface-500 font-medium">
                      {orgSubTab === "pending" ? "No organizations awaiting verification in your city." :
                        orgSubTab === "verified" ? "No verified organizations yet." : "No rejected organizations."}
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {displayOrgs.map((org: any) => (
                      <div key={org._id} className="bg-white border border-surface-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                          {/* Logo */}
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-emerald-100 flex items-center justify-center flex-shrink-0 border border-surface-200">
                            {org.logoUrl
                              ? <img src={org.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                              : <Briefcase className="w-8 h-8 text-emerald-600" />}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-black text-surface-900 text-lg">{org.name}</h3>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${
                                org.status === "VERIFIED" ? "bg-success-100 text-success-700" :
                                org.status === "PENDING_VERIFICATION" ? "bg-warning-100 text-warning-700" :
                                org.status === "SUSPENDED" ? "bg-surface-100 text-surface-600" :
                                "bg-error-100 text-error-700"
                              }`}>{org.status.replace("_", " ")}</span>
                            </div>
                            <p className="text-sm text-surface-500 mb-2 line-clamp-2">{org.description}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-surface-500">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{org.city}, {org.state}</span>
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{org.activeMembers} members</span>
                              <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" />{org.contactPersonName}</span>
                              <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />Trust: {org.trustScore}/100</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {org.workCategories?.slice(0, 4).map((cat: string) => (
                                <span key={cat} className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{cat}</span>
                              ))}
                            </div>
                          </div>

                          {/* Trust Score */}
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div className="w-14 h-14 rounded-full bg-amber-50 border-4 border-amber-200 flex items-center justify-center">
                              <span className="font-black text-amber-700 text-sm">{org.trustScore}</span>
                            </div>
                            <span className="text-[10px] text-surface-400 font-bold">TRUST</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="border-t border-surface-100 bg-surface-50/50 px-5 py-3 flex flex-wrap gap-2">
                          {org.status === "PENDING_VERIFICATION" && (
                            <>
                              <button
                                onClick={() => handleOrgAction(org._id, "approved")}
                                disabled={orgActionLoading}
                                className="flex items-center gap-1.5 bg-success-600 hover:bg-success-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => { setOrgActionId(org._id); setOrgActionType("reject"); setOrgActionMessage(""); }}
                                className="flex items-center gap-1.5 bg-error-50 hover:bg-error-100 text-error-700 border border-error-200 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                              <button
                                onClick={() => { setOrgActionId(org._id); setOrgActionType("info"); setOrgActionMessage(""); }}
                                className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" /> Request Info
                              </button>
                            </>
                          )}
                          {org.status === "VERIFIED" && (
                            <button
                              onClick={() => handleOrgAction(org._id, "suspended", "Suspended by admin")}
                              disabled={orgActionLoading}
                              className="flex items-center gap-1.5 bg-warning-50 hover:bg-warning-100 text-warning-700 border border-warning-200 text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Suspend
                            </button>
                          )}
                          {org.status === "SUSPENDED" && (
                            <button
                              onClick={() => handleOrgAction(org._id, "reactivated")}
                              disabled={orgActionLoading}
                              className="flex items-center gap-1.5 bg-success-50 hover:bg-success-100 text-success-700 border border-success-200 text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Reactivate
                            </button>
                          )}

                          {/* Inline message form for reject/info */}
                          {orgActionId === org._id && (orgActionType === "reject" || orgActionType === "info") && (
                            <div className="w-full mt-2 space-y-2">
                              <textarea
                                value={orgActionMessage}
                                onChange={e => setOrgActionMessage(e.target.value)}
                                placeholder={orgActionType === "reject" ? "Reason for rejection..." : "What additional information is needed?"}
                                className="w-full border border-surface-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleOrgAction(org._id, orgActionType === "reject" ? "rejected" : "info_requested", orgActionMessage)}
                                  disabled={orgActionLoading || !orgActionMessage}
                                  className="bg-surface-900 text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-50"
                                >
                                  {orgActionLoading ? "Sending..." : "Send"}
                                </button>
                                <button onClick={() => { setOrgActionId(null); setOrgActionType(null); }} className="text-surface-500 text-xs px-3 py-2 rounded-xl hover:bg-surface-200">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ════ COMMUNITY DRIVES TAB ════ */}
          {/* ════ CERTIFICATES TAB ════ */}
          {activeTab === "certificates" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <h3 className="text-xl font-black text-surface-900">Generated Certificates</h3>
                <div className="relative w-full sm:w-auto">
                  <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search certificates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-80 pl-10 pr-4 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-white border border-surface-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-surface-50 border-b border-surface-200 text-surface-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-6 py-4">Certificate ID</th>
                        <th className="px-6 py-4">Volunteer</th>
                        <th className="px-6 py-4">Drive</th>
                        <th className="px-6 py-4">Issued At</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {certificates
                        .filter(c => !searchQuery || c.volunteerName.toLowerCase().includes(searchQuery.toLowerCase()) || c.certificateId.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(cert => (
                        <tr key={cert.certificateId} className="hover:bg-surface-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-primary-600">{cert.certificateId}</td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-surface-900">{cert.volunteerName}</p>
                            <p className="text-[10px] text-surface-500">{cert.volunteerEmail}</p>
                          </td>
                          <td className="px-6 py-4 font-medium text-surface-700 truncate max-w-[200px]">{cert.driveName || "Unknown Drive"}</td>
                          <td className="px-6 py-4 text-surface-500">{new Date(cert.issuedAt || cert.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={\`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase \${cert.status === 'Generated' || cert.status === 'Sent' ? 'bg-success-50 text-success-700 border border-success-100' : cert.status === 'Failed' ? 'bg-error-50 text-error-700 border border-error-100' : 'bg-warning-50 text-warning-700 border border-warning-100'}\`}>
                                {cert.status === 'Generated' || cert.status === 'Sent' ? <CheckCircle2 className="w-3 h-3"/> : cert.status === 'Failed' ? <AlertTriangle className="w-3 h-3"/> : <Clock className="w-3 h-3"/>}
                                {cert.status}
                              </span>
                              {cert.emailSent && (
                                <span className="text-[9px] font-medium text-surface-400">Email sent {new Date(cert.emailSentAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {cert.certificatePdfUrl && (
                                <>
                                  <a href={cert.certificatePdfUrl} download className="p-2 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Download PDF"><Download className="w-4 h-4"/></a>
                                  <a href={cert.certificateImageUrl} download className="p-2 text-surface-400 hover:text-info-600 hover:bg-info-50 rounded-lg transition-colors" title="Download Image"><Eye className="w-4 h-4"/></a>
                                </>
                              )}
                              <button 
                                onClick={async () => {
                                  if(!confirm('Resend email to ' + cert.volunteerEmail + '?')) return;
                                  try {
                                    await fetch('/api/certificates', {
                                      method: 'POST',
                                      headers: {'Content-Type': 'application/json'},
                                      body: JSON.stringify({ action: 'resend_email', certificateId: cert._id })
                                    });
                                    alert('Email resend triggered successfully.');
                                    loadCertificates();
                                  } catch (e) {
                                    alert('Failed to resend email.');
                                  }
                                }}
                                className="p-2 text-surface-400 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors" title="Resend Email"
                              >
                                <Send className="w-4 h-4"/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {certificates.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-surface-500 font-medium">
                            No certificates generated yet. Complete a drive to trigger generation.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "community_drives" && (
            <div className="space-y-6">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-2xl font-black text-surface-900 tracking-tight">Community Drives</h2>
               </div>
               
               <div className="flex gap-2 flex-wrap mb-4">
                  {(["active", "requests", "verification", "cancellations"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setDrivesSubTab(tab)}
                      className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all capitalize ${
                        drivesSubTab === tab
                          ? "bg-primary-600 text-white"
                          : "bg-white border border-surface-200 text-surface-600 hover:bg-surface-50"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Render Drives based on SubTab */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {drives.filter(d => {
                    if (drivesSubTab === "active") return ["WAITING_FOR_ORG", "ORG_APPROVED", "VOLUNTEER_REG_OPEN", "REG_CLOSED", "DRIVE_IN_PROGRESS", "DRIVE_COMPLETED", "OVERDUE"].includes(d.status);
                    if (drivesSubTab === "requests") return d.status === "ORG_PENDING_APPROVAL";
                    if (drivesSubTab === "verification") return d.status === "ADMIN_VERIFICATION_PENDING";
                    if (drivesSubTab === "cancellations") return d.cancellationRequestedBy && !d.cancellationApprovedAt;
                    return false;
                  }).map(drive => (
                    <Card key={drive._id} className={`overflow-hidden border-2 ${drive.status === "OVERDUE" ? "border-error-300 bg-error-50" : "border-surface-200"}`}>
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                           <div>
                             <h3 className="font-black text-lg text-surface-900">{drive.title}</h3>
                             <p className="text-xs text-surface-500 font-bold mt-1 uppercase flex items-center gap-1">
                                <Activity className="w-3.5 h-3.5" /> {drive.status.replace(/_/g, " ")}
                             </p>
                           </div>
                           <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-black uppercase">
                             {drive.category}
                           </span>
                        </div>
                        <p className="text-sm text-surface-600 line-clamp-2 mb-3">{drive.description}</p>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-medium text-surface-600">
                          <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-surface-400" /> {new Date(drive.date).toLocaleDateString()} at {drive.time}</div>
                          <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-surface-400" /> {drive.joinedVolunteers || 0} / {drive.maxVolunteers || drive.requiredVolunteers} Vols</div>
                          {drive.acceptedOrgName && <div className="col-span-2 flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-surface-400" /> Managed by: {drive.acceptedOrgName}</div>}
                        </div>

                        {/* Actions */}
                        {drive.status === "ORG_PENDING_APPROVAL" && drive.orgRequests?.filter((r:any) => r.status === "pending").map((req: any) => (
                           <div key={req.orgId} className="bg-white border border-surface-200 p-3 rounded-xl mb-2">
                             <div className="flex justify-between items-center mb-2">
                               <p className="font-bold text-sm text-surface-800">{req.orgName}</p>
                               <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Trust: {req.trustScore}</span>
                             </div>
                             <p className="text-xs text-surface-500 mb-3 text-italic">&quot;{req.message || "No message provided"}&quot;</p>
                             <div className="flex gap-2">
                               <button onClick={() => {
                                 fetch(`/api/community-drives/${drive._id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ action: "org_approve", orgId: req.orgId, adminEmail: appUser.email }) }).then(loadDrives);
                               }} className="flex-1 bg-success-600 hover:bg-success-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">Approve</button>
                               <button onClick={() => {
                                 fetch(`/api/community-drives/${drive._id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ action: "org_reject", orgId: req.orgId }) }).then(loadDrives);
                               }} className="flex-1 bg-error-50 hover:bg-error-100 text-error-700 text-xs font-bold py-2 rounded-lg transition-colors">Reject</button>
                             </div>
                           </div>
                        ))}

                        {drive.status === "OVERDUE" && (
                           <div className="bg-white border border-error-200 p-3 rounded-xl mt-3">
                             <p className="text-xs font-bold text-error-700 mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Drive missed its scheduled date.</p>
                             <div className="flex gap-2">
                               <button onClick={() => {
                                 fetch(`/api/community-drives/${drive._id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ action: "admin_reassign_suspended" }) }).then(loadDrives);
                               }} className="flex-1 bg-error-600 hover:bg-error-700 text-white text-xs font-bold py-2 rounded-lg">Reset to Waiting</button>
                               <button onClick={() => {
                                 fetch(`/api/community-drives/${drive._id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ action: "admin_restore_employee_suspended" }) }).then(loadDrives);
                               }} className="flex-1 bg-surface-200 hover:bg-surface-300 text-surface-800 text-xs font-bold py-2 rounded-lg">Fail & Restore Emp</button>
                             </div>
                           </div>
                        )}

                        {drive.cancellationRequestedBy && !drive.cancellationApprovedAt && (
                           <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl mt-3">
                             <p className="text-xs font-bold text-orange-800 mb-1">Cancellation Requested</p>
                             <p className="text-xs text-orange-700 mb-3">Reason: {drive.cancelReason}</p>
                             <button onClick={() => {
                               fetch(`/api/community-drives/${drive._id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ action: "approve_cancel" }) }).then(() => { loadDrives(); loadIssues(); });
                             }} className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">Approve Cancellation</button>
                           </div>
                        )}

                        {drive.status === "ADMIN_VERIFICATION_PENDING" && (
                           <div className="bg-success-50 border border-success-200 p-4 rounded-xl mt-3">
                             <p className="text-sm font-bold text-success-800 mb-3">Completion Verification Needed</p>
                             
                             <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                   <p className="text-xs font-bold text-success-700 uppercase mb-1">Work Performed</p>
                                   <p className="text-xs text-success-900 bg-success-100 p-2 rounded-lg">{drive.workPerformed}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                   <div className="bg-success-100 p-2 rounded-lg">
                                      <p className="text-xs font-bold text-success-700 uppercase">Volunteers</p>
                                      <p className="text-lg font-black text-success-900">{drive.totalVolunteersPresent}</p>
                                   </div>
                                   <div className="bg-success-100 p-2 rounded-lg">
                                      <p className="text-xs font-bold text-success-700 uppercase">Hours</p>
                                      <p className="text-lg font-black text-success-900">{drive.hoursWorked}</p>
                                   </div>
                                </div>
                             </div>

                             {drive.afterImageUrls && drive.afterImageUrls.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs font-bold text-success-700 uppercase mb-1">Evidence ({drive.afterImageUrls.length})</p>
                                  <div className="flex gap-2 overflow-x-auto pb-2">
                                    {drive.afterImageUrls.map((url: string, i: number) => (
                                      <img key={i} src={url} alt={`evidence-${i}`} className="w-24 h-24 object-cover rounded-lg flex-shrink-0 border border-success-200" />
                                    ))}
                                  </div>
                                </div>
                             )}

                             {drive.additionalNotes && (
                                <p className="text-xs text-success-700 mb-4 bg-white/50 p-2 rounded italic">"{drive.additionalNotes}"</p>
                             )}

                             <button onClick={() => {
                               fetch(`/api/community-drives/${drive._id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ action: "admin_verify" }) }).then(() => { loadDrives(); loadIssues(); });
                             }} className="w-full bg-success-600 hover:bg-success-700 text-white text-sm font-bold py-2.5 rounded-lg transition-colors shadow-sm">
                                Verify & Publish Story
                             </button>
                           </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {drives.filter(d => {
                    if (drivesSubTab === "active") return ["WAITING_FOR_ORG", "ORG_APPROVED", "VOLUNTEER_REG_OPEN", "REG_CLOSED", "DRIVE_IN_PROGRESS", "DRIVE_COMPLETED", "OVERDUE"].includes(d.status);
                    if (drivesSubTab === "requests") return d.status === "ORG_PENDING_APPROVAL" || d.status === "ADMIN_VERIFICATION_PENDING";
                    if (drivesSubTab === "cancellations") return d.cancellationRequestedBy && !d.cancellationApprovedAt;
                    return false;
                  }).length === 0 && (
                     <div className="col-span-1 lg:col-span-2 text-center py-12 bg-white rounded-2xl border border-surface-200">
                       <p className="text-surface-500 font-medium">No drives found in this category.</p>
                     </div>
                  )}
                </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── CREATED ORG CREDENTIALS MODAL ─── */}
      {createdOrgCredentials && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-success-700 flex items-center gap-2"><CheckCircle2 className="w-6 h-6"/> Success</h2>
            </div>
            <p className="text-sm text-surface-600 mb-4">The organization was created and verified. Share these temporary credentials with the admin.</p>
            <div className="bg-surface-50 border border-surface-200 p-4 rounded-xl space-y-3 mb-6">
               <div><p className="text-[10px] uppercase font-bold text-surface-500">Username</p><p className="font-mono font-bold text-surface-900">{createdOrgCredentials.username}</p></div>
               <div><p className="text-[10px] uppercase font-bold text-surface-500">Password</p><p className="font-mono font-bold text-surface-900">{createdOrgCredentials.password}</p></div>
            </div>
            <button onClick={() => setCreatedOrgCredentials(null)} className="w-full bg-surface-900 hover:bg-surface-800 text-white font-bold py-3 rounded-xl transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* ─── ANALYTICS ─────────────────────────────────────────────── */}
      {activeTab === "analytics" && (
         <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex justify-between items-end mb-6">
               <div>
                  <h2 className="text-2xl font-black text-slate-900">Platform Analytics</h2>
                  <p className="text-slate-500 font-medium mt-1">Real-time overview of the entire Community Hero platform.</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Users className="w-6 h-6"/></div>
                  <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Citizens</p>
                     <p className="text-2xl font-black text-slate-900">{analytics?.totalCitizens || 0}</p>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0"><Shield className="w-6 h-6"/></div>
                  <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Verified Orgs</p>
                     <p className="text-2xl font-black text-slate-900">{analytics?.verifiedOrgs || 0}</p>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0"><Award className="w-6 h-6"/></div>
                  <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Certificates Issued</p>
                     <p className="text-2xl font-black text-slate-900">{analytics?.generatedCertificates || 0}</p>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0"><Activity className="w-6 h-6"/></div>
                  <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Completed Drives</p>
                     <p className="text-2xl font-black text-slate-900">{analytics?.completedDrives || 0}</p>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8">
               <h3 className="text-lg font-black text-slate-900 mb-6">Platform Growth</h3>
               <div className="h-[300px] w-full">
                  {analytics?.communityGrowth ? (
                    <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={analytics.communityGrowth} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                          <RechartsTooltip cursor={{fill: '#F1F5F9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Line type="monotone" dataKey="citizens" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Citizens" />
                          <Line type="monotone" dataKey="orgs" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Organizations" />
                       </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 font-bold">No growth data available</div>
                  )}
               </div>
            </div>
         </div>
      )}

      {/* ─── LEADERBOARD ─────────────────────────────────────────────── */}
      {activeTab === "leaderboard" && (
         <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex justify-between items-end mb-6">
               <div>
                  <h2 className="text-2xl font-black text-slate-900">Global Leaderboard Management</h2>
                  <p className="text-slate-500 font-medium mt-1">Review the top contributing volunteers across all cities.</p>
               </div>
            </div>
            
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="divide-y divide-slate-100">
                  {leaderboard.length > 0 ? leaderboard.map((item, index) => (
                     <div key={item.id} className="p-4 sm:p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                        <div className="w-12 text-center shrink-0">
                           <span className="text-xl font-black text-slate-400">#{item.rank}</span>
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                              <UserCheck className="w-5 h-5 text-slate-400" />
                           </div>
                           <div>
                              <p className="font-bold text-slate-900 truncate flex items-center gap-2">
                                 {item.name}
                              </p>
                              <p className="text-xs text-slate-500 font-medium flex gap-3 mt-1">
                                 <span>{item.drives} Drives</span>
                                 <span>{item.hours} Hours</span>
                                 <span>{item.city}</span>
                              </p>
                           </div>
                        </div>
                        <div className="text-right shrink-0">
                           <p className="text-xl font-black text-amber-500">{item.points}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Points</p>
                        </div>
                     </div>
                  )) : (
                     <div className="p-12 text-center text-slate-400 font-bold">Leaderboard data unavailable</div>
                  )}
               </div>
            </div>
         </div>
      )}

      {/* ─── CONVERT TO COMMUNITY DRIVE MODAL ─── */}
      {convertingIssue && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8">
             <div className="flex justify-between items-center p-6 border-b border-surface-100">
               <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
                 <Users className="w-5 h-5 text-indigo-600" /> Create Community Drive
               </h2>
               <button onClick={() => setConvertingIssue(null)} className="text-surface-400 hover:text-surface-600"><X className="w-5 h-5" /></button>
             </div>
             <form onSubmit={async (e) => {
               e.preventDefault();
               setConvertingLoading(true);
               try {
                 const res = await fetch("/api/community-drives", {
                   method: "POST",
                   headers: { "Content-Type": "application/json" },
                   body: JSON.stringify({
                     issueId: convertingIssue.issueId || convertingIssue.id,
                     createdByAdmin: appUser.email,
                     title: driveTitle,
                     description: driveDescription,
                     category: driveCategory,
                     requiredOrgCategory: driveReqOrgCat,
                     instructions: driveInstructions
                   })
                 });
                 if (res.ok) {
                   setConvertingIssue(null);
                   loadIssues();
                   loadDrives();
                 } else {
                   const err = await res.json();
                   alert(err.error);
                 }
               } finally {
                 setConvertingLoading(false);
               }
             }} className="p-6 space-y-4">
               
               <div className="bg-surface-50 p-4 rounded-xl border border-surface-200 flex gap-4 mb-2">
                 {convertingIssue.imageBase64 && <img src={convertingIssue.imageBase64} className="w-20 h-20 object-cover rounded-lg" />}
                 <div>
                   <p className="text-xs font-bold text-surface-500 uppercase">From Issue</p>
                   <p className="text-sm font-medium text-surface-900 line-clamp-2 mt-1">{convertingIssue.description}</p>
                   <p className="text-xs text-surface-600 mt-1"><MapPin className="w-3 h-3 inline mr-1" />{convertingIssue.address || convertingIssue.location}</p>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                   <label className="block text-xs font-bold text-surface-600 mb-1">Drive Title</label>
                   <input required value={driveTitle} onChange={e=>setDriveTitle(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm" placeholder="e.g. Weekend Lake Cleanup" />
                 </div>
                 <div className="col-span-2">
                   <label className="block text-xs font-bold text-surface-600 mb-1">Description & Goal</label>
                   <textarea required rows={3} value={driveDescription} onChange={e=>setDriveDescription(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm resize-none" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-surface-600 mb-1">Drive Category</label>
                   <select required value={driveCategory} onChange={e=>setDriveCategory(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm">
                     <option>Cleanliness</option><option>Tree Plantation</option><option>Park Cleaning</option><option>Awareness Campaign</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-surface-600 mb-1">Required Org Category</label>
                   <select required value={driveReqOrgCat} onChange={e=>setDriveReqOrgCat(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm">
                     <option>Cleanliness</option><option>Tree Plantation</option><option>Park Cleaning</option><option>Awareness Campaign</option>
                   </select>
                 </div>
                 <div className="col-span-2">
                   <label className="block text-xs font-bold text-surface-600 mb-1">Instructions for Organization</label>
                   <input value={driveInstructions} onChange={e=>setDriveInstructions(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm" placeholder="e.g. Bring extra gloves" />
                 </div>
               </div>

               <div className="pt-4 border-t border-surface-100 flex gap-3 justify-end">
                 <button type="button" onClick={() => setConvertingIssue(null)} className="px-5 py-2.5 text-sm font-bold text-surface-600 hover:bg-surface-100 rounded-xl transition-colors">Cancel</button>
                 <button type="submit" disabled={convertingLoading} className="px-5 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors flex items-center gap-2">
                   {convertingLoading ? "Creating..." : <><Users className="w-4 h-4"/> Publish Drive</>}
                 </button>
               </div>
             </form>
           </div>
         </div>
      )}

      {/* ─── AREA ADOPTIONS ─────────────────────────────────────────── */}
      {activeTab === "area_adoptions" && (
        <div className="space-y-6 animate-fade-in pb-12">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Area Adoptions</h2>
              <p className="text-slate-500 font-medium mt-1">Review and approve public space adoptions by verified organizations.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adoptedAreas.map(area => (
              <Card key={area._id} className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{area.name}</h3>
                    <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4"/> {area.location}, {area.city}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${area.status === "ADOPTED" ? "bg-emerald-100 text-emerald-700" : area.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {area.status}
                  </span>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duration</p>
                    <p className="text-sm font-semibold text-slate-700">{area.durationMonths} Months</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reason</p>
                    <p className="text-sm text-slate-700">{area.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Maintenance Plan</p>
                    <p className="text-sm text-slate-700 line-clamp-3">{area.maintenancePlan}</p>
                  </div>
                  
                  {area.status === "PENDING" && (
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button onClick={async () => {
                        await fetch(`/api/adopted-areas/${area._id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ status: "ADOPTED", adminEmail: appUser.email, adminRole: "admin" }) });
                        loadExtraData();
                      }} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-sm transition-colors">
                        Approve
                      </button>
                      <button onClick={async () => {
                        await fetch(`/api/adopted-areas/${area._id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ status: "REJECTED", adminEmail: appUser.email, adminRole: "admin" }) });
                        loadExtraData();
                      }} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2 rounded-xl text-sm transition-colors border border-red-200">
                        Reject
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {adoptedAreas.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 font-medium">
                No area adoption requests found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── HEALTH MONITORING ─────────────────────────────────────── */}
      {activeTab === "health" && (
        <div className="space-y-6 animate-fade-in pb-12">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Platform Health Monitor</h2>
              <p className="text-slate-500 font-medium mt-1">Real-time system health and critical alerts.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Unresolved Emergencies</p>
                <p className="text-3xl font-black text-red-600">{healthData?.unresolvedEmergencies || 0}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-100" />
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">AI Flagged Fake Reports</p>
                <p className="text-3xl font-black text-orange-600">{healthData?.aiFailures || 0}</p>
              </div>
              <Shield className="w-10 h-10 text-orange-100" />
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Overdue Drives</p>
                <p className="text-3xl font-black text-amber-600">{healthData?.overdueDrives || 0}</p>
              </div>
              <Clock className="w-10 h-10 text-amber-100" />
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Unread System Notifications</p>
                <p className="text-3xl font-black text-indigo-600">{healthData?.pendingNotifications || 0}</p>
              </div>
              <Activity className="w-10 h-10 text-indigo-100" />
            </div>
          </div>
        </div>
      )}

      {/* ─── AUDIT LOGS ────────────────────────────────────────────── */}
      {activeTab === "audit_logs" && (
        <div className="space-y-6 animate-fade-in pb-12">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Immutable Audit Logs</h2>
              <p className="text-slate-500 font-medium mt-1">Tracing every critical platform action securely.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action Type</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Target ID</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log: any) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-4 text-sm font-bold text-slate-800">{log.actionType}</td>
                    <td className="p-4 text-sm text-slate-600 font-medium">{log.actorEmail} <span className="text-[10px] bg-slate-100 px-2 rounded text-slate-400 uppercase">{log.actorRole}</span></td>
                    <td className="p-4 text-sm text-slate-500 font-mono">{log.targetEntityId}</td>
                    <td className="p-4 text-sm font-bold text-emerald-600">{log.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ISSUE HEATMAP ─────────────────────────────────────────── */}
      {activeTab === "heatmap" && (
        <div className="space-y-6 animate-fade-in pb-12 h-full flex flex-col">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Issue Heatmap</h2>
              <p className="text-slate-500 font-medium mt-1">Geospatial overview of community issues.</p>
            </div>
          </div>
          
          <div className="flex-1 bg-slate-200 rounded-3xl border border-slate-300 overflow-hidden relative min-h-[500px]">
             {/* Note: Integration with Mapbox or Google Maps goes here. Displaying placeholder. */}
             <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 text-slate-500">
                <MapPin className="w-16 h-16 opacity-50" />
                <p className="font-bold text-lg">Interactive Map Integration Placeholder</p>
                <p className="text-sm">Connect a map provider (e.g. Mapbox) to plot {liveIssues.length} live issues using coordinates.</p>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
