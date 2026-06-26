"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard, Compass, Calendar, Users, ClipboardList,
  MessageSquare, Trophy, UserCircle, Bell, Settings, LogOut,
  TrendingUp, Star, MapPin, Clock, ChevronRight, Search,
  Filter, CheckCircle2, AlertCircle, Building2, Menu, X,
  Shield, Activity, Zap, Heart, RefreshCw, Eye, Edit3,
  Phone, Mail, Globe, Camera, Plus, Award, Leaf, Trash2, ArrowRight, Download
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// ── Types ──────────────────────────────────────────────────────────────
interface OrgProfile {
  _id: string;
  name: string;
  type: string;
  registrationNumber?: string;
  description: string;
  mission?: string;
  city: string;
  state: string;
  address: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  activeMembers: number;
  website?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  workCategories: string[];
  workingAreas?: string[];
  gallery?: string[];
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  rejectionReason?: string;
  adminMessage?: string;
  trustScore: number;
  mustChangePassword?: boolean;
  verifiedBy?: string;
  verifiedByRole?: string;
  verifiedAt?: string;
  username?: string;
  createdAt: string;
  members?: any[];
  announcements?: any[];
  totalVolunteerHours?: number;
}

interface Drive {
  _id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  state: string;
  address: string;
  date: string;
  time: string;
  durationHours?: number;
  requiredVolunteers: number;
  maxVolunteers?: number;
  joinedVolunteers: number;
  meetingLocation?: string;
  instructions?: string;
  status: "OPEN" | "CANCELLED" | "COMPLETED" | "WAITING_FOR_ORG" | "ORG_PENDING_APPROVAL" | "ORG_APPROVED" | "VOLUNTEER_REG_OPEN" | "REG_CLOSED" | "DRIVE_IN_PROGRESS" | "DRIVE_COMPLETED" | "ADMIN_VERIFICATION_PENDING" | "VERIFIED" | "FAILED" | "OVERDUE";
  orgName?: string;
  orgRequests?: any[];
  volunteers?: any[];
  driveTimeline?: any[];
  cancellationRequestedBy?: string;
  cancellationReason?: string;
  cancellationApprovedAt?: string;
  completionImageUrl?: string;
  completionNotes?: string;
  isAttendanceLocked?: boolean;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

// ── Constants ───────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  "Cleanliness": "🧹", "Tree Plantation": "🌳", "Plastic Collection": "♻️",
  "Animal Welfare": "🐾", "Awareness Campaign": "📣", "Wall Painting": "🎨",
  "Park Cleaning": "🏞️", "Lake Cleaning": "💧", "River Cleaning": "🌊",
  "Public Health": "🏥", "Waste Segregation": "🗂️", "Other": "⭐"
};

const ALL_CATEGORIES = [
  "Cleanliness", "Tree Plantation", "Plastic Collection", "Animal Welfare",
  "Awareness Campaign", "Wall Painting", "Park Cleaning", "Lake Cleaning",
  "River Cleaning", "Public Health", "Waste Segregation", "Other"
];

type Tab = "dashboard" | "drives" | "my-drives" | "volunteers" | "attendance" |
  "community" | "achievements" | "profile" | "notifications" | "settings" | "members" | "join-requests" | "announcements" | "analytics" | "certificates" | "leaderboard" | "adopt-area";

// ── Main Component ──────────────────────────────────────────────────────
export default function VolunteerOrgDashboard() {
  const { appUser, role, loading, logoutMock } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [myDrives, setMyDrives] = useState<Drive[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myAdoptedAreas, setMyAdoptedAreas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState<Drive | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState({
    workPerformed: "",
    hoursWorked: 0,
    totalVolunteersPresent: 0,
    afterImageUrls: "",
    videoUrls: "",
    wasteCollected: 0,
    treesPlanted: 0,
    awarenessParticipants: 0,
    additionalNotes: ""
  });

  // Drive filters
  const [driveSearch, setDriveSearch] = useState("");
  const [driveCategoryFilter, setDriveCategoryFilter] = useState("All");
  const [driveStatusFilter, setDriveStatusFilter] = useState("All");

  // Profile edit
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<OrgProfile>>({});
  const [editSaving, setEditSaving] = useState(false);

  // Settings
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  // ── Auth Guard ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading) {
      if (!appUser) {
        router.push("/login"); return;
      }
      if (role !== "volunteer_org") {
        router.push("/"); return;
      }
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser, role, loading]);

  // ── Data Loading ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!appUser) return;
    setIsLoading(true);
    try {
      // Find org by email
      const orgRes = await fetch(`/api/volunteer-org?id=${encodeURIComponent((appUser as any).orgId || "")}`);
      if (orgRes.ok) {
        const orgs = await orgRes.json();
        if (Array.isArray(orgs) && orgs.length > 0) {
          setOrg(orgs[0]);
        } else {
          // Fallback: search by email
          const byEmail = await fetch(`/api/volunteer-org`).then(r => r.json());
          const found = Array.isArray(byEmail)
            ? byEmail.find((o: OrgProfile) => o.contactEmail.toLowerCase() === appUser.email?.toLowerCase())
            : null;
          if (found) setOrg(found);
        }
      }
    } catch { /* silently fail */ }

    // Try alternate lookup by email
    try {
      if (!org) {
        const allOrgs = await fetch("/api/volunteer-org").then(r => r.json());
        const found = Array.isArray(allOrgs)
          ? allOrgs.find((o: OrgProfile) => o.contactEmail.toLowerCase() === appUser.email?.toLowerCase())
          : null;
        if (found) setOrg(found);
      }
    } catch { /* */ }

    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser]);

  const loadOrgData = useCallback(async (orgData: OrgProfile) => {
    try {
      const [drivesRes, myDrivesRes, notifRes, analyticsRes, leaderboardRes, adoptedAreasRes] = await Promise.all([
        fetch(`/api/community-drives?city=${encodeURIComponent(orgData.city)}&status=WAITING_FOR_ORG`),
        fetch(`/api/community-drives?orgId=${orgData._id}`),
        fetch(`/api/notifications?userId=${encodeURIComponent(orgData.contactEmail)}`),
        fetch(`/api/analytics/org?orgId=${orgData._id}`),
        fetch(`/api/leaderboard?category=organizations&timeFilter=all_time`),
        fetch(`/api/adopted-areas?orgId=${orgData._id}`),
      ]);

      if (drivesRes.ok) setDrives(await drivesRes.json());
      if (myDrivesRes.ok) setMyDrives(await myDrivesRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (leaderboardRes.ok) {
         const data = await leaderboardRes.json();
         setLeaderboard(data.leaderboard || []);
      }
      if (adoptedAreasRes.ok) setMyAdoptedAreas(await adoptedAreasRes.json());
    } catch { /* */ }
  }, []);

  useEffect(() => {
    if (org) loadOrgData(org);
  }, [org, loadOrgData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const markNotificationRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true })
    });
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => markNotificationRead(n._id)));
  };

  const handleSaveProfile = async () => {
    if (!org) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/volunteer-org/${org._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const updated = await res.json();
        setOrg(updated);
        setEditMode(false);
      }
    } finally {
      setEditSaving(false);
    }
  };

  // ── Loading / Pending ─────────────────────────────────────────────────
  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading Dashboard…</p>
        </div>
      </div>
    );
  }

  // Pending verification screen
  if (org && org.status === "PENDING_VERIFICATION") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-white p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-amber-200 shadow-xl p-10 text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-amber-200">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Pending</h1>
          <p className="text-slate-500 mb-6 text-sm">
            Your organization <span className="font-bold text-slate-900">{org.name}</span> is awaiting admin verification.
            You'll receive a notification once approved.
          </p>
          <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 mb-6 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-semibold">{org.type}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">City</span><span className="font-semibold">{org.city}, {org.state}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">PENDING VERIFICATION</span></div>
          </div>
          <button onClick={logoutMock} className="w-full bg-slate-900 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Rejected screen
  if (org && org.status === "REJECTED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-red-200 shadow-xl p-10 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-200">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Rejected</h1>
          <p className="text-slate-500 text-sm mb-4">Your organization was not approved.</p>
          {org.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-left">
              <p className="text-red-700 text-sm font-semibold">Reason:</p>
              <p className="text-red-600 text-sm mt-1">{org.rejectionReason}</p>
            </div>
          )}
          <button onClick={logoutMock} className="w-full bg-slate-900 text-white font-bold py-3 rounded-2xl">Sign Out</button>
        </div>
      </div>
    );
  }

  // Suspended
  if (org && org.status === "SUSPENDED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-white p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-10 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-slate-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Organization Suspended</h1>
          <p className="text-slate-500 text-sm mb-6">Contact your administrator for more information.</p>
          <button onClick={logoutMock} className="w-full bg-slate-900 text-white font-bold py-3 rounded-2xl">Sign Out</button>
        </div>
      </div>
    );
  }


  // Prompt 2: First Login Password Gate
  if (org && org.mustChangePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-indigo-200 shadow-xl p-10 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Change Default Password</h1>
          <p className="text-slate-500 text-sm mb-6">You are logging in with a temporary admin-generated password. Please secure your account by choosing a new password.</p>
          <form className="space-y-4 text-left" onSubmit={async (e) => {
            e.preventDefault();
            if (newPassword !== confirmPassword) { setPwMsg("Passwords do not match."); return; }
            setEditSaving(true);
            try {
              const res = await fetch(`/api/volunteer-org/${org._id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword, mustChangePassword: false })
              });
              if (res.ok) {
                setOrg({ ...org, mustChangePassword: false });
                setNewPassword(""); setConfirmPassword(""); setPwMsg("");
              } else {
                setPwMsg("Failed to update password.");
              }
            } finally { setEditSaving(false); }
          }}>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">New Password</label>
              <input type="password" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Confirm New Password</label>
              <input type="password" required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {pwMsg && <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg">{pwMsg}</p>}
            <button type="submit" disabled={editSaving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl transition-colors">
              {editSaving ? "Saving..." : "Update Password & Continue"}
            </button>
          </form>
          <button onClick={logoutMock} className="w-full mt-4 text-slate-500 text-sm font-bold hover:text-slate-700">Sign Out</button>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const upcomingDrives = myDrives.filter(d => d.status === "OPEN" && new Date(d.date) >= new Date());
  const completedDrives = myDrives.filter(d => d.status === "COMPLETED");

  const filteredDrives = drives.filter(d => {
    const matchSearch = !driveSearch || d.title.toLowerCase().includes(driveSearch.toLowerCase()) ||
      d.description.toLowerCase().includes(driveSearch.toLowerCase());
    const matchCat = driveCategoryFilter === "All" || d.category === driveCategoryFilter;
    const matchStatus = driveStatusFilter === "All" || d.status === driveStatusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  // ── Sidebar Nav ────────────────────────────────────────────────────────
  const navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "drives", label: "Available Drives", icon: <Compass className="w-4 h-4" /> },
    { id: "my-drives", label: "My Drives", icon: <Calendar className="w-4 h-4" /> },
    { id: "adopt-area", label: "Adopt an Area", icon: <MapPin className="w-4 h-4" /> },
    { id: "volunteers", label: "Drive Requests", icon: <Users className="w-4 h-4" /> },
    { id: "join-requests", label: "Membership Requests", icon: <Shield className="w-4 h-4" /> },
    { id: "members", label: "Member Directory", icon: <UserCircle className="w-4 h-4" /> },
    { id: "announcements", label: "Announcements", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "attendance", label: "Attendance", icon: <ClipboardList className="w-4 h-4" /> },
    { id: "community", label: "Community Posts", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "analytics", label: "Analytics", icon: <Activity className="w-4 h-4" /> },
    { id: "leaderboard", label: "Leaderboard", icon: <Trophy className="w-4 h-4" /> },
    { id: "achievements", label: "Achievements", icon: <Award className="w-4 h-4" /> },
    { id: "certificates", label: "Certificates", icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: "profile", label: "Profile", icon: <Settings className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" />, badge: unreadCount },
  ];

  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-300 flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>
      {/* Brand */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {org?.logoUrl ? (
            <img src={org.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{org?.name || "Organization"}</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <span className="text-emerald-400 text-[10px] font-semibold">VERIFIED</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trust Score */}
      <div className="px-4 py-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-400 text-xs">Trust Score</span>
          <span className="text-emerald-400 font-bold text-xs">{org?.trustScore ?? 50}/100</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full transition-all"
            style={{ width: `${org?.trustScore ?? 50}%` }}
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === item.id
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && item.badge > 0 ? (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={logoutMock}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-red-900/30 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-900">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-slate-900 text-sm">
                {navItems.find(n => n.id === activeTab)?.label}
              </h1>
              <p className="text-xs text-slate-400">{org?.city}, {org?.state}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleRefresh} className={`text-slate-400 hover:text-slate-700 ${refreshing ? "animate-spin" : ""}`}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className="relative text-slate-400 hover:text-slate-700"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">

          {/* ── DASHBOARD HOME ─────────────────────────────────────────── */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fade-in">
              {/* Welcome Banner */}
              {org?.coverImageUrl && (
                <div className="relative rounded-2xl overflow-hidden h-36">
                  <img src={org.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 to-transparent flex items-center p-6">
                    <div>
                      <p className="text-white/70 text-xs">Welcome back</p>
                      <h2 className="text-white font-bold text-xl">{org.name}</h2>
                    </div>
                  </div>
                </div>
              )}

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Upcoming Drives", value: upcomingDrives.length, icon: <Calendar className="w-5 h-5 text-blue-600" />, color: "bg-blue-50 border-blue-100" },
                  { label: "Completed Drives", value: completedDrives.length, icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, color: "bg-emerald-50 border-emerald-100" },
                  { label: "Trust Score", value: `${org?.trustScore ?? 50}/100`, icon: <Star className="w-5 h-5 text-amber-500" />, color: "bg-amber-50 border-amber-100" },
                  { label: "Active Members", value: org?.activeMembers ?? 0, icon: <Users className="w-5 h-5 text-purple-600" />, color: "bg-purple-50 border-purple-100" },
                ].map((kpi, i) => (
                  <div key={i} className={`${kpi.color} border rounded-2xl p-4 flex items-start gap-3`}>
                    <div className="bg-white rounded-xl p-2 shadow-sm">{kpi.icon}</div>
                    <div>
                      <p className="text-slate-500 text-xs">{kpi.label}</p>
                      <p className="text-slate-900 font-bold text-xl">{kpi.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Quick Actions
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: "View Available Drives", icon: <Compass className="w-4 h-4" />, tab: "drives" as Tab, color: "text-blue-600 hover:bg-blue-50" },
                      { label: "Manage Profile", icon: <Edit3 className="w-4 h-4" />, tab: "profile" as Tab, color: "text-emerald-600 hover:bg-emerald-50" },
                      { label: "View Notifications", icon: <Bell className="w-4 h-4" />, tab: "notifications" as Tab, color: "text-purple-600 hover:bg-purple-50" },
                      { label: "Achievements", icon: <Trophy className="w-4 h-4" />, tab: "achievements" as Tab, color: "text-amber-600 hover:bg-amber-50" },
                    ].map(action => (
                      <button
                        key={action.tab}
                        onClick={() => setActiveTab(action.tab)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${action.color} transition-all text-left`}
                      >
                        {action.icon} {action.label} <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Notifications */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-500" /> Recent Notifications
                    {unreadCount > 0 && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount} new</span>}
                  </h3>
                  {notifications.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">No notifications yet</p>
                  ) : (
                    <div className="space-y-2">
                      {notifications.slice(0, 4).map(n => (
                        <div key={n._id} className={`p-3 rounded-xl text-xs ${n.isRead ? "bg-slate-50" : "bg-emerald-50 border border-emerald-100"}`}>
                          <p className="font-semibold text-slate-800">{n.title}</p>
                          <p className="text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      ))}
                      <button onClick={() => setActiveTab("notifications")} className="text-emerald-600 text-xs font-semibold hover:underline">View all →</button>
                    </div>
                  )}
                </div>

                {/* Organization Info */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-500" /> Organization
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600">{org?.city}, {org?.state}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600 break-all">{org?.contactEmail}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600">{org?.contactPhone}</span>
                    </div>
                    {org?.website && (
                      <div className="flex items-start gap-2">
                        <Globe className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <a href={org.website} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline truncate">{org.website}</a>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                      {org?.workCategories?.slice(0, 4).map(cat => (
                        <span key={cat} className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {CATEGORY_ICONS[cat]} {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── AVAILABLE DRIVES ─────────────────────────────────────── */}
          {activeTab === "drives" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search drives..."
                    value={driveSearch}
                    onChange={e => setDriveSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <select
                  value={driveCategoryFilter}
                  onChange={e => setDriveCategoryFilter(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="All">All Categories</option>
                  {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={driveStatusFilter}
                  onChange={e => setDriveStatusFilter(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="All">All Status</option>
                  <option value="WAITING_FOR_ORG">Waiting for Organization</option>
                  <option value="ORG_PENDING_APPROVAL">Pending Admin Approval</option>
                </select>
              </div>

              {filteredDrives.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                  <Compass className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <h3 className="font-bold text-slate-700 mb-2">No Drives Available</h3>
                  <p className="text-slate-400 text-sm">Available community drives in {org?.city} will appear here once posted by admins.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDrives.map(drive => (
                    <DriveCard 
                       key={drive._id} 
                       drive={drive} 
                       onClick={() => setSelectedDrive(drive)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MY DRIVES ────────────────────────────────────────────── */}
          {activeTab === "my-drives" && (
            <div className="animate-fade-in">
              {myDrives.length === 0 ? (
                <EmptyState icon={<Calendar className="w-12 h-12" />} title="No Drives Yet" message="Your organization's drives will appear here after they are created and assigned." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myDrives.map(drive => (
                     <DriveCard 
                        key={drive._id} 
                        drive={drive} 
                        showOrg={false} 
                        onClick={() => setSelectedDrive(drive)} 
                     />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── VOLUNTEERS ─────────────────────────────────────────── */}
          {activeTab === "volunteers" && (
            <div className="animate-fade-in">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-900">Volunteer Management</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Citizens who join your drives will appear here</p>
                  </div>
                  <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full">Coming in Prompt 2</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {["Volunteer Name", "Phone", "Email", "Drive", "Attendance", "Certificate", "Hours"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={7} className="text-center py-16 text-slate-400">
                          <Users className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                          <p className="font-medium">No volunteers yet</p>
                          <p className="text-xs mt-1">Volunteers joining your drives will be listed here</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── ATTENDANCE ─────────────────────────────────────────── */}
          {activeTab === "attendance" && (
            <EmptyState
              icon={<ClipboardList className="w-12 h-12" />}
              title="Attendance Tracking"
              message="Drive attendance records will appear here. This feature activates when volunteers join your drives (Prompt 2)."
              badge="Coming in Prompt 2"
            />
          )}

          {/* ── COMMUNITY POSTS ────────────────────────────────────── */}
          {activeTab === "community" && (
            <EmptyState
              icon={<MessageSquare className="w-12 h-12" />}
              title="Community Posts"
              message="After completing drives, community posts showcasing your impact will automatically appear here. Keep doing great work!"
              badge="Posts appear after drive completion"
            />
          )}

          {/* ── ACHIEVEMENTS ────────────────────────────────────────── */}
          {activeTab === "achievements" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { label: "Completed Drives", value: completedDrives.length, icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />, color: "border-emerald-200 bg-emerald-50" },
                  { label: "Total Volunteers", value: 0, icon: <Users className="w-6 h-6 text-blue-600" />, color: "border-blue-200 bg-blue-50" },
                  { label: "Hours Contributed", value: 0, icon: <Clock className="w-6 h-6 text-amber-600" />, color: "border-amber-200 bg-amber-50" },
                  { label: "Waste Collected (kg)", value: 0, icon: <Trash2 className="w-6 h-6 text-slate-600" />, color: "border-slate-200 bg-slate-50" },
                  { label: "Trees Planted", value: 0, icon: <Leaf className="w-6 h-6 text-teal-600" />, color: "border-teal-200 bg-teal-50" },
                  { label: "Community Rating", value: "—", icon: <Heart className="w-6 h-6 text-rose-600" />, color: "border-rose-200 bg-rose-50" },
                  { label: "Trust Score", value: `${org?.trustScore ?? 50}/100`, icon: <Star className="w-6 h-6 text-amber-500" />, color: "border-amber-200 bg-amber-50" },
                  { label: "Active Members", value: org?.activeMembers ?? 0, icon: <Award className="w-6 h-6 text-purple-600" />, color: "border-purple-200 bg-purple-50" },
                ].map((item, i) => (
                  <div key={i} className={`${item.color} border rounded-2xl p-5 text-center`}>
                    <div className="flex justify-center mb-3">{item.icon}</div>
                    <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Trust score breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" /> Trust Score Breakdown
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-bold text-slate-900">{org?.trustScore ?? 50}</div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Current Score</span>
                      <span className="text-slate-700 font-semibold">{org?.trustScore ?? 50}/100</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all"
                        style={{ width: `${org?.trustScore ?? 50}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <p className="font-bold text-emerald-700 mb-1">📈 Increases when:</p>
                    <ul className="space-y-0.5 text-emerald-600">
                      <li>• Drives completed successfully</li>
                      <li>• High volunteer attendance</li>
                      <li>• Positive admin reviews</li>
                      <li>• On-time completion</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3">
                    <p className="font-bold text-red-700 mb-1">📉 Decreases when:</p>
                    <ul className="space-y-0.5 text-red-600">
                      <li>• Drives are cancelled</li>
                      <li>• Fake reports submitted</li>
                      <li>• Missed deadlines</li>
                      <li>• Incomplete work</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MEMBERSHIP REQUESTS ────────────────────────────────────────── */}
          {activeTab === "join-requests" && (
             <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                   <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-600"/> Membership Requests
                   </h2>
                   
                   {(!org?.members || org.members.filter((m:any) => m.status === "pending").length === 0) ? (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                         <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                         <p className="text-slate-500 font-medium">No pending membership requests.</p>
                      </div>
                   ) : (
                      <div className="space-y-4">
                         {org.members.filter((m:any) => m.status === "pending").map((member: any, idx: number) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                               <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                     <h3 className="font-bold text-slate-900 text-lg">{member.name}</h3>
                                     <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">{member.age} yrs</span>
                                  </div>
                                  <p className="text-xs font-bold text-slate-500 mb-3">{member.email} • {member.phone}</p>
                                  
                                  <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100 text-sm space-y-2">
                                     <div><span className="font-bold text-slate-700">Skills:</span> {member.skills}</div>
                                     <div><span className="font-bold text-slate-700">Availability:</span> {member.availability}</div>
                                     <div><span className="font-bold text-slate-700">Motivation:</span> {member.motivation}</div>
                                  </div>
                                  
                                  {/* Rich Citizen History */}
                                  <div className="flex items-center gap-4 bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-xs text-emerald-800">
                                     <div className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5"/> <b>{member.previousDrives || 0}</b> Completed Drives</div>
                                     <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> <b>{member.previousHours || 0}</b> Hours</div>
                                     <div className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> <b>{member.attendancePercentage || 100}%</b> Attendance</div>
                                  </div>
                               </div>
                               
                               <div className="flex md:flex-col gap-2 w-full md:w-auto">
                                  <button onClick={async () => {
                                     try {
                                        const res = await fetch(`/api/volunteer-org/${org._id}`, {
                                           method: "PATCH", headers: {"Content-Type":"application/json"},
                                           body: JSON.stringify({ action: "approve_member", email: member.email })
                                        });
                                        if (res.ok) loadData();
                                     } catch {}
                                  }} className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 text-center">Approve</button>
                                  <button onClick={async () => {
                                     try {
                                        const res = await fetch(`/api/volunteer-org/${org._id}`, {
                                           method: "PATCH", headers: {"Content-Type":"application/json"},
                                           body: JSON.stringify({ action: "reject_member", email: member.email })
                                        });
                                        if (res.ok) loadData();
                                     } catch {}
                                  }} className="flex-1 md:flex-none px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all active:scale-95 text-center">Decline</button>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>
          )}

          {/* ── MEMBER DIRECTORY ────────────────────────────────────────── */}
          {activeTab === "members" && (
             <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                   <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600"/> Member Directory
                   </h2>
                   
                   {(!org?.members || org.members.filter((m:any) => m.status === "member").length === 0) ? (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                         <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                         <p className="text-slate-500 font-medium">You have no active members.</p>
                      </div>
                   ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {org.members.filter((m:any) => m.status === "member").map((member: any, idx: number) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
                               <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                                     {member.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                     <h3 className="font-bold text-slate-900 leading-tight">{member.name}</h3>
                                     <p className="text-[10px] font-bold text-slate-500">{member.email}</p>
                                  </div>
                               </div>
                               
                               <div className="text-xs text-slate-600 space-y-1 mb-4 flex-1">
                                  <p><span className="font-bold text-slate-400">Phone:</span> {member.phone}</p>
                                  <p><span className="font-bold text-slate-400">Joined:</span> {new Date(member.joinedAt).toLocaleDateString()}</p>
                               </div>
                               
                               <button onClick={async () => {
                                  if (!confirm("Are you sure you want to remove this member?")) return;
                                  try {
                                     const res = await fetch(`/api/volunteer-org/${org._id}`, {
                                        method: "PATCH", headers: {"Content-Type":"application/json"},
                                        body: JSON.stringify({ action: "remove_member", email: member.email })
                                     });
                                     if (res.ok) loadData();
                                  } catch {}
                               }} className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors text-center">
                                  Remove Member
                               </button>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>
          )}

          {/* ── ANNOUNCEMENTS ────────────────────────────────────────────── */}
          {activeTab === "announcements" && (
             <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                   <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-600"/> Announcements
                   </h2>
                   
                   <form onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const title = fd.get("title") as string;
                      const message = fd.get("message") as string;
                      const target = fd.get("target") as string;
                      
                      try {
                         const res = await fetch(`/api/volunteer-org/${org?._id}`, {
                            method: "PATCH", headers: {"Content-Type":"application/json"},
                            body: JSON.stringify({ action: "post_announcement", title, message, target, postedBy: appUser?.name })
                         });
                         if (res.ok) {
                            (e.target as HTMLFormElement).reset();
                            loadData();
                         }
                      } catch {}
                   }} className="mb-8 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                      <h3 className="font-bold text-slate-900 mb-4">Post a New Announcement</h3>
                      <div className="space-y-4">
                         <div>
                            <input name="title" required type="text" placeholder="Announcement Title" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                         </div>
                         <div>
                            <textarea name="message" required placeholder="Write your message here..." rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"></textarea>
                         </div>
                         <div>
                            <select name="target" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none">
                               <option value="all_members">All Active Members</option>
                               {myDrives.map(d => <option key={d._id} value={d._id}>Drive: {d.title}</option>)}
                            </select>
                         </div>
                         <button type="submit" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-600/20 active:scale-95 transition-all">
                            Post Announcement
                         </button>
                      </div>
                   </form>

                   <div className="space-y-4">
                      {(!org?.announcements || org.announcements.length === 0) ? (
                         <div className="text-center py-8">
                            <p className="text-slate-500 text-sm">No announcements posted yet.</p>
                         </div>
                      ) : (
                         org.announcements.slice().reverse().map((ann: any, idx: number) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                               <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-bold text-slate-900">{ann.title}</h3>
                                  <span className="text-[10px] font-bold text-slate-400">{new Date(ann.postedAt).toLocaleString()}</span>
                               </div>
                               <p className="text-sm text-slate-600 mb-3 whitespace-pre-wrap">{ann.message}</p>
                               <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                                  <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded">Target: {ann.target === "all_members" ? "All Members" : "Specific Drive"}</span>
                                  <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100">Posted by {ann.postedBy}</span>
                               </div>
                            </div>
                         ))
                      )}
                   </div>
                </div>
             </div>
          )}

          {/* ── ANALYTICS ─────────────────────────────────────────────── */}
          {activeTab === "analytics" && (
             <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-end mb-6">
                   <div>
                      <h2 className="text-2xl font-black text-slate-900">Impact Analytics</h2>
                      <p className="text-slate-500 font-medium mt-1">Track your organization's verified impact over time.</p>
                   </div>
                   <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm text-sm font-bold text-slate-700 hover:bg-slate-50">
                      <Download className="w-4 h-4" /> Export Report
                   </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Calendar className="w-6 h-6"/></div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Drives Organized</p>
                         <p className="text-2xl font-black text-slate-900">{analytics?.totalDrives || 0}</p>
                      </div>
                   </div>
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0"><CheckCircle2 className="w-6 h-6"/></div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Completion Rate</p>
                         <p className="text-2xl font-black text-slate-900">{analytics?.totalDrives ? Math.round((analytics.completedDrives / analytics.totalDrives) * 100) : 0}%</p>
                      </div>
                   </div>
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0"><Star className="w-6 h-6"/></div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Average Rating</p>
                         <p className="text-2xl font-black text-slate-900">{analytics?.avgRating || "N/A"}</p>
                      </div>
                   </div>
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0"><Users className="w-6 h-6"/></div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Retention Rate</p>
                         <p className="text-2xl font-black text-slate-900">{analytics?.retentionRate || 0}%</p>
                      </div>
                   </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8">
                   <h3 className="text-lg font-black text-slate-900 mb-6">Monthly Volunteer Engagement</h3>
                   <div className="h-[300px] w-full">
                      {analytics?.monthlyGrowth ? (
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={analytics.monthlyGrowth} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                              <RechartsTooltip cursor={{fill: '#F1F5F9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                              <Bar dataKey="volunteers" fill="#10B981" radius={[4, 4, 0, 0]} />
                           </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 font-bold">No engagement data available</div>
                      )}
                   </div>
                </div>
             </div>
          )}

          {/* ── LEADERBOARD ─────────────────────────────────────────────── */}
          {activeTab === "leaderboard" && (
             <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-end mb-6">
                   <div>
                      <h2 className="text-2xl font-black text-slate-900">Organization Leaderboard</h2>
                      <p className="text-slate-500 font-medium mt-1">See how your impact compares to other organizations.</p>
                   </div>
                </div>
                
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                   <div className="divide-y divide-slate-100">
                      {leaderboard.length > 0 ? leaderboard.map((item, index) => (
                         <div key={item.id} className={`p-4 sm:p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors ${item.id === org?._id ? "bg-emerald-50 hover:bg-emerald-50/80" : ""}`}>
                            <div className="w-12 text-center shrink-0">
                               {index < 3 ? (
                                  <Trophy className={`w-8 h-8 mx-auto ${index === 0 ? "text-amber-400" : index === 1 ? "text-slate-300" : "text-amber-700"}`} />
                               ) : (
                                  <span className="text-xl font-black text-slate-400">#{item.rank}</span>
                               )}
                            </div>
                            <div className="flex-1 min-w-0 flex items-center gap-4">
                               {item.logo ? (
                                  <img src={item.logo} className="w-10 h-10 rounded-full object-cover shrink-0" alt="logo" />
                               ) : (
                                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                     <Building2 className="w-5 h-5 text-slate-400" />
                                  </div>
                               )}
                               <div>
                                  <p className="font-bold text-slate-900 truncate flex items-center gap-2">
                                     {item.name}
                                     {item.id === org?._id && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                                  </p>
                                  <p className="text-xs text-slate-500 font-medium flex gap-3 mt-1">
                                     <span>{item.drives} Drives</span>
                                     <span>{item.trustScore} Trust</span>
                                  </p>
                               </div>
                            </div>
                            <div className="text-right shrink-0">
                               <p className="text-xl font-black text-emerald-600">{item.impactScore}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Impact Score</p>
                            </div>
                         </div>
                      )) : (
                         <div className="p-12 text-center text-slate-400 font-bold">Leaderboard data unavailable</div>
                      )}
                   </div>
                </div>
             </div>
          )}

          {/* ── CERTIFICATES ─────────────────────────────────────────────── */}
          {activeTab === "certificates" && (
             <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-end mb-6">
                   <div>
                      <h2 className="text-2xl font-black text-slate-900">Issued Certificates</h2>
                      <p className="text-slate-500 font-medium mt-1">Digital certificates issued to volunteers from your drives.</p>
                   </div>
                </div>
                
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 text-center">
                   <CheckCircle2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                   <h3 className="text-xl font-black text-slate-900 mb-2">Automated Certificate Issuance</h3>
                   <p className="text-slate-500 font-medium max-w-md mx-auto mb-6">
                      Certificates are automatically generated and issued to volunteers who are marked as "Present" when a drive is completed and verified by an Admin.
                   </p>
                   <div className="flex justify-center gap-8">
                      <div className="text-center">
                         <p className="text-3xl font-black text-amber-500">{completedDrives.reduce((acc, d) => acc + (d.volunteers?.filter(v => v.attendance === "present")?.length || 0), 0)}</p>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Total Issued</p>
                      </div>
                      <div className="w-px bg-slate-200"></div>
                      <div className="text-center">
                         <p className="text-3xl font-black text-emerald-500">{org?.totalVolunteerHours || 0}</p>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Hours Verified</p>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* ── PROFILE ─────────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in">
              {/* Cover & Logo */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="h-40 bg-gradient-to-r from-emerald-500 to-teal-500 relative">
                  {org?.coverImageUrl && <img src={org.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />}
                </div>
                <div className="px-6 pb-6">
                  <div className="flex items-end gap-4 -mt-8 mb-4">
                    <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-emerald-600 flex items-center justify-center">
                      {org?.logoUrl
                        ? <img src={org.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        : <Building2 className="w-10 h-10 text-white" />
                      }
                    </div>
                    <div className="flex-1 pb-1">
                      <h2 className="text-xl font-bold text-slate-900">{org?.name}</h2>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">✓ VERIFIED</span>
                        {org?.verifiedBy && (
                           <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Shield className="w-3 h-3 text-emerald-600"/> Verified by {org.verifiedBy} ({new Date(org.verifiedAt || "").toLocaleDateString()})
                           </span>
                        )}
                        <span className="text-slate-500 text-xs">{org?.type}</span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-slate-500 text-xs">{org?.city}, {org?.state}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setEditMode(!editMode); setEditForm(org || {}); }}
                      className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-4 py-2 rounded-xl transition-all"
                    >
                      <Edit3 className="w-4 h-4" /> {editMode ? "Cancel" : "Edit Profile"}
                    </button>
                  </div>

                  {editMode ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Organization Name</label>
                          <input type="text" value={editForm.name || ""} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Contact Phone</label>
                          <input type="tel" value={editForm.contactPhone || ""} onChange={e => setEditForm(f => ({ ...f, contactPhone: e.target.value }))}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                          <textarea rows={3} value={editForm.description || ""} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-700 block mb-1">Mission Statement</label>
                          <textarea rows={2} value={editForm.mission || ""} onChange={e => setEditForm(f => ({ ...f, mission: e.target.value }))}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Website</label>
                          <input type="url" value={editForm.website || ""} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Contact Person</label>
                          <input type="text" value={editForm.contactPersonName || ""} onChange={e => setEditForm(f => ({ ...f, contactPersonName: e.target.value }))}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                        </div>
                      </div>
                      <button onClick={handleSaveProfile} disabled={editSaving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-60">
                        {editSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-slate-600 text-sm leading-relaxed">{org?.description}</p>
                      {org?.mission && (
                        <div className="bg-emerald-50 rounded-xl p-4">
                          <p className="text-xs font-bold text-emerald-700 mb-1">Mission Statement</p>
                          <p className="text-emerald-800 text-sm">{org.mission}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-400 mb-0.5">Registration No.</p>
                          <p className="font-semibold text-slate-800">{org?.registrationNumber || "—"}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-400 mb-0.5">Active Members</p>
                          <p className="font-semibold text-slate-800">{org?.activeMembers}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-400 mb-0.5">Trust Score</p>
                          <p className="font-semibold text-slate-800">{org?.trustScore}/100</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Work Categories</p>
                        <div className="flex flex-wrap gap-2">
                          {org?.workCategories?.map(cat => (
                            <span key={cat} className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                              {CATEGORY_ICONS[cat]} {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ────────────────────────────────────────── */}
          {activeTab === "notifications" && (
            <div className="animate-fade-in">
              <div className="bg-white rounded-2xl border border-slate-200">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-900">Notifications</h2>
                    <p className="text-xs text-slate-400">{unreadCount} unread</p>
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-emerald-600 text-sm font-semibold hover:underline">
                      Mark all as read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <Bell className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                    <p className="font-medium">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map(n => (
                      <div
                        key={n._id}
                        onClick={() => !n.isRead && markNotificationRead(n._id)}
                        className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${!n.isRead ? "bg-emerald-50/50" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.isRead ? "bg-slate-200" : "bg-emerald-500"}`} />
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-semibold ${n.isRead ? "text-slate-600" : "text-slate-900"}`}>{n.title}</p>
                              <span className="text-[10px] text-slate-400 flex-shrink-0">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SETTINGS ────────────────────────────────────────────── */}
          {activeTab === "settings" && (
            <div className="max-w-lg space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-500" /> Change Password
                </h2>
                {pwMsg && (
                  <div className={`text-sm font-semibold mb-4 p-3 rounded-xl ${pwMsg.includes("success") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {pwMsg}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <button
                    onClick={async () => {
                      if (!newPassword || newPassword !== confirmPassword) {
                        setPwMsg("Passwords do not match."); return;
                      }
                      if (!org) return;
                      const res = await fetch(`/api/volunteer-org/${org._id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ password: newPassword })
                      });
                      if (res.ok) {
                        setPwMsg("✓ Password updated successfully!");
                        setNewPassword(""); setConfirmPassword("");
                      } else {
                        setPwMsg("Failed to update password.");
                      }
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Update Password
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-slate-500" /> Account Info
                </h2>
                <p className="text-xs text-slate-400 mb-4">Your organization account details</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Email</span>
                    <span className="font-semibold text-slate-900">{org?.contactEmail}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">City</span>
                    <span className="font-semibold text-slate-900">{org?.city}, {org?.state}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500">Member Since</span>
                    <span className="font-semibold text-slate-900">
                      {org?.createdAt ? new Date(org.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <button onClick={logoutMock} className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 rounded-2xl transition-all border border-red-200">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── DRIVE DASHBOARD MODAL ── */}
      {selectedDrive && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl my-8 overflow-hidden">
             
             {/* Header */}
             <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-start">
                <div>
                   <h2 className="text-2xl font-black text-slate-900">{selectedDrive.title}</h2>
                   <div className="flex items-center gap-3 mt-2 text-xs font-bold">
                     <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-wider">{selectedDrive.status.replace(/_/g, " ")}</span>
                     <span className="text-slate-500 uppercase flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(selectedDrive.date).toLocaleDateString()}</span>
                     <span className="text-slate-500 uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> {selectedDrive.time}</span>
                   </div>
                </div>
                <button onClick={() => setSelectedDrive(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
             </div>

             <div className="p-6">
                <div className="grid grid-cols-3 gap-6">
                   {/* Main Info */}
                   <div className="col-span-2 space-y-6">
                      <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl">{selectedDrive.description}</p>
                      </div>

                      {/* Timeline Updates (My Drives only) */}
                      {selectedDrive.orgName === org?.name && ["ORG_APPROVED", "VOLUNTEER_REG_OPEN", "REG_CLOSED", "DRIVE_IN_PROGRESS"].includes(selectedDrive.status) && (
                         <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Post Timeline Update</h3>
                            <form className="flex gap-2" onSubmit={async(e) => {
                               e.preventDefault();
                               const input = e.currentTarget.elements.namedItem("note") as HTMLInputElement;
                               if (!input.value) return;
                               setActionLoading(true);
                               try {
                                 const res = await fetch(`/api/community-drives/${selectedDrive._id}`, {
                                   method: "PATCH", headers: {"Content-Type":"application/json"},
                                   body: JSON.stringify({ action: "add_timeline", note: input.value, author: org?.name })
                                 });
                                 if (res.ok) { handleRefresh(); setSelectedDrive(null); }
                               } finally { setActionLoading(false); }
                            }}>
                               <input name="note" placeholder="E.g. Tools have arrived" required className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                               <button type="submit" disabled={actionLoading} className="bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl disabled:opacity-50">Post</button>
                            </form>
                         </div>
                      )}

                      {/* Drive Timeline */}
                      {selectedDrive.driveTimeline && selectedDrive.driveTimeline.length > 0 && (
                        <div>
                           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Live Timeline</h3>
                           <div className="relative border-l-2 border-emerald-100 ml-3 space-y-4">
                              {selectedDrive.driveTimeline.map((item, i) => (
                                 <div key={i} className="relative pl-5">
                                    <div className="absolute w-3 h-3 rounded-full -left-[7px] top-1 bg-emerald-400 ring-2 ring-white" />
                                    <p className="text-sm font-medium text-slate-700">{item.note}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.author} • {new Date(item.timestamp).toLocaleString()}</p>
                                 </div>
                              ))}
                           </div>
                        </div>
                      )}
                   </div>

                   {/* Sidebar Info */}
                   <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                         <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-1"><MapPin className="w-4 h-4"/> Location</h3>
                         <p className="text-sm text-blue-900 font-medium">{selectedDrive.meetingLocation || selectedDrive.address}</p>
                         <p className="text-xs text-blue-700 mt-1">{selectedDrive.city}, {selectedDrive.state}</p>
                      </div>

                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                         <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-1"><Users className="w-4 h-4"/> Volunteers</h3>
                         <div className="flex items-end gap-1">
                            <span className="text-2xl font-black text-amber-900">{selectedDrive.joinedVolunteers}</span>
                            <span className="text-sm font-bold text-amber-700 mb-1">/ {selectedDrive.maxVolunteers || selectedDrive.requiredVolunteers}</span>
                         </div>
                         <p className="text-xs text-amber-700 mt-1">Required: {selectedDrive.requiredVolunteers}</p>
                      </div>

                      {selectedDrive.instructions && (
                        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                           <h3 className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-1 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Instructions</h3>
                           <p className="text-sm text-purple-900">{selectedDrive.instructions}</p>
                        </div>
                      )}

                      {/* Supporting Organizations */}
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                         <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1"><Building2 className="w-4 h-4"/> Supporting Orgs</h3>
                         {(!selectedDrive.orgRequests || selectedDrive.orgRequests.length === 0) ? (
                            <p className="text-sm text-emerald-700 mb-3">No supporting organizations partnered yet.</p>
                         ) : (
                            <div className="space-y-2 mb-3">
                               {selectedDrive.orgRequests.map((req: any, i: number) => (
                                  <div key={i} className="flex justify-between items-center text-sm">
                                     <span className="font-semibold text-emerald-900">{req.orgName}</span>
                                     <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${req.status === 'APPROVED' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>{req.status}</span>
                                  </div>
                               ))}
                            </div>
                         )}

                         {selectedDrive.orgName === org?.name && (
                            <button onClick={() => {
                               const supportingOrgId = prompt("Enter the Organization ID of the partner:");
                               const supportingOrgName = prompt("Enter the Organization Name:");
                               if (supportingOrgId && supportingOrgName) {
                                  fetch(`/api/community-drives/${selectedDrive._id}`, {
                                     method: "PATCH", headers: {"Content-Type":"application/json"},
                                     body: JSON.stringify({ action: "add_supporting_org", supportingOrgId, supportingOrgName })
                                  }).then(() => { handleRefresh(); setSelectedDrive(null); });
                               }
                            }} className="w-full bg-emerald-200 hover:bg-emerald-300 text-emerald-900 font-bold py-2 rounded-xl text-xs transition-colors">
                               Add Partner Org
                            </button>
                         )}
                      </div>
                   </div>
                </div>
             </div>

             {/* Footer Actions */}
             <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-wrap gap-3 justify-end">
                {selectedDrive.status === "WAITING_FOR_ORG" && (
                   <button onClick={async() => {
                      setActionLoading(true);
                      try {
                        const res = await fetch(`/api/community-drives/${selectedDrive._id}`, {
                           method: "PATCH", headers: {"Content-Type":"application/json"},
                           body: JSON.stringify({ action: "org_accept", orgId: org?._id, orgName: org?.name })
                        });
                        if (res.ok) { handleRefresh(); setSelectedDrive(null); }
                      } finally { setActionLoading(false); }
                   }} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors shadow-sm">
                      {actionLoading ? "Requesting..." : "Take This Drive"}
                   </button>
                )}

                {selectedDrive.orgName === org?.name && selectedDrive.status === "ORG_APPROVED" && (
                   <button onClick={async() => {
                      setActionLoading(true);
                      try {
                        const res = await fetch(`/api/community-drives/${selectedDrive._id}`, {
                           method: "PATCH", headers: {"Content-Type":"application/json"},
                           body: JSON.stringify({ action: "open_volunteers" })
                        });
                        if (res.ok) { handleRefresh(); setSelectedDrive(null); }
                      } finally { setActionLoading(false); }
                   }} disabled={actionLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors shadow-sm">
                      Open Volunteer Registrations
                   </button>
                )}

                {selectedDrive.orgName === org?.name && selectedDrive.status === "VOLUNTEER_REG_OPEN" && (
                   <button onClick={async() => {
                      setActionLoading(true);
                      try {
                        const res = await fetch(`/api/community-drives/${selectedDrive._id}`, {
                           method: "PATCH", headers: {"Content-Type":"application/json"},
                           body: JSON.stringify({ action: "close_volunteers" })
                        });
                        if (res.ok) { handleRefresh(); setSelectedDrive(null); }
                      } finally { setActionLoading(false); }
                   }} disabled={actionLoading} className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors shadow-sm">
                      Close Registrations
                   </button>
                )}

                {selectedDrive.orgName === org?.name && selectedDrive.status === "REG_CLOSED" && (
                   <button onClick={async() => {
                      setActionLoading(true);
                      try {
                        const res = await fetch(`/api/community-drives/${selectedDrive._id}`, {
                           method: "PATCH", headers: {"Content-Type":"application/json"},
                           body: JSON.stringify({ action: "start_drive" })
                        });
                        if (res.ok) { handleRefresh(); setSelectedDrive(null); }
                      } finally { setActionLoading(false); }
                   }} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors shadow-sm">
                      Start Drive
                   </button>
                )}

                {selectedDrive.orgName === org?.name && selectedDrive.status === "DRIVE_IN_PROGRESS" && (
                   <button onClick={() => {
                      setCompletionData({
                        workPerformed: "", hoursWorked: selectedDrive.durationHours || 0,
                        totalVolunteersPresent: selectedDrive.joinedVolunteers, afterImageUrls: "", videoUrls: "",
                        wasteCollected: 0, treesPlanted: 0, awarenessParticipants: 0, additionalNotes: ""
                      });
                      setShowCompletionModal(true);
                   }} disabled={actionLoading} className="bg-success-600 hover:bg-success-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors shadow-sm">
                      Mark Completed (Submit Proof)
                   </button>
                )}

                {/* Cancel Drive Button */}
                {selectedDrive.orgName === org?.name && ["ORG_APPROVED", "VOLUNTEER_REG_OPEN", "REG_CLOSED"].includes(selectedDrive.status) && (
                   <button onClick={async() => {
                      const reason = prompt("Enter reason for cancellation:");
                      if (!reason) return;
                      setActionLoading(true);
                      try {
                        const res = await fetch(`/api/community-drives/${selectedDrive._id}`, {
                           method: "PATCH", headers: {"Content-Type":"application/json"},
                           body: JSON.stringify({ action: "request_cancel", reason, orgName: org?.name })
                        });
                        if (res.ok) { handleRefresh(); setSelectedDrive(null); }
                      } finally { setActionLoading(false); }
                   }} disabled={actionLoading} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-bold px-6 py-3 rounded-xl transition-colors">
                      Request Cancellation
                   </button>
                )}
             </div>
           </div>
         </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && selectedDrive && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
               <div>
                 <h2 className="text-xl font-bold text-slate-800">Submit Completion Proof</h2>
                 <p className="text-sm text-slate-500">Provide details for {selectedDrive.title}</p>
               </div>
               <button onClick={() => setShowCompletionModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full">
                 <X className="w-5 h-5" />
               </button>
             </div>
             <div className="p-6 space-y-5">
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">Work Performed (Summary) *</label>
                   <textarea required rows={2} value={completionData.workPerformed} onChange={e => setCompletionData({...completionData, workPerformed: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-success-500/20 focus:border-success-500" placeholder="Briefly describe what was accomplished..."></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Total Volunteers Present *</label>
                      <input type="number" required value={completionData.totalVolunteersPresent} onChange={e => setCompletionData({...completionData, totalVolunteersPresent: parseInt(e.target.value)||0})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-success-500/20 focus:border-success-500" />
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Total Hours Worked *</label>
                      <input type="number" required value={completionData.hoursWorked} onChange={e => setCompletionData({...completionData, hoursWorked: parseInt(e.target.value)||0})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-success-500/20 focus:border-success-500" />
                   </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                   <h4 className="font-bold text-slate-700 mb-3 text-sm flex items-center gap-2"><Activity className="w-4 h-4"/> Optional Impact Metrics</h4>
                   <div className="grid grid-cols-3 gap-3">
                      <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Waste Collected (kg)</label>
                         <input type="number" value={completionData.wasteCollected} onChange={e => setCompletionData({...completionData, wasteCollected: parseInt(e.target.value)||0})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Trees Planted</label>
                         <input type="number" value={completionData.treesPlanted} onChange={e => setCompletionData({...completionData, treesPlanted: parseInt(e.target.value)||0})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">People Reached</label>
                         <input type="number" value={completionData.awarenessParticipants} onChange={e => setCompletionData({...completionData, awarenessParticipants: parseInt(e.target.value)||0})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                      </div>
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">After Image URLs (Comma separated) *</label>
                   <input type="text" required value={completionData.afterImageUrls} onChange={e => setCompletionData({...completionData, afterImageUrls: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-success-500/20 focus:border-success-500" placeholder="https://..." />
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">Additional Notes</label>
                   <textarea rows={2} value={completionData.additionalNotes} onChange={e => setCompletionData({...completionData, additionalNotes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-success-500/20 focus:border-success-500" placeholder="Any challenges faced or special mentions..."></textarea>
                </div>
                <button onClick={async() => {
                    if (!completionData.workPerformed || !completionData.afterImageUrls) return alert("Fill required fields");
                    setActionLoading(true);
                    try {
                      const res = await fetch(`/api/community-drives/${selectedDrive._id}`, {
                         method: "PATCH", headers: {"Content-Type":"application/json"},
                         body: JSON.stringify({
                             action: "drive_complete",
                             workPerformed: completionData.workPerformed,
                             hoursWorked: completionData.hoursWorked,
                             totalVolunteersPresent: completionData.totalVolunteersPresent,
                             afterImageUrls: completionData.afterImageUrls.split(",").map(s=>s.trim()).filter(Boolean),
                             wasteCollected: completionData.wasteCollected,
                             treesPlanted: completionData.treesPlanted,
                             awarenessParticipants: completionData.awarenessParticipants,
                             additionalNotes: completionData.additionalNotes
                         })
                      });
                      if (res.ok) { handleRefresh(); setShowCompletionModal(false); setSelectedDrive(null); }
                    } finally { setActionLoading(false); }
                }} disabled={actionLoading} className="w-full bg-success-600 hover:bg-success-700 text-white font-bold py-3 rounded-xl shadow-sm mt-2 transition-colors">
                   {actionLoading ? "Submitting..." : "Submit Proof & Complete"}
                </button>
             </div>
           </div>
         </div>
      )}
      {/* ── ADOPT AN AREA TAB ─────────────────────────────────────── */}
      {activeTab === "adopt-area" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Adopt a Public Area</h2>
              <p className="text-slate-500 font-medium mt-1">Take responsibility for long-term maintenance of local spaces.</p>
            </div>
            <button onClick={() => {
              // Simple prompt or mock logic for submitting a request for area adoption
              const areaName = prompt("Enter the name of the area (e.g., Downtown Park):");
              const location = prompt("Enter the specific location/address:");
              const reason = prompt("Why do you want to adopt this area?");
              const duration = prompt("Duration (in months):", "6");
              
              if (areaName && location && reason && duration) {
                fetch("/api/adopted-areas", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: areaName,
                    location,
                    city: org?.city,
                    reason,
                    durationMonths: parseInt(duration),
                    maintenancePlan: "Monthly community drives and weekly check-ins.",
                    orgId: org?._id,
                    orgName: org?.name
                  })
                }).then(() => handleRefresh());
              }
            }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors shadow-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Request Adoption
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {myAdoptedAreas.map(area => (
              <div key={area._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{area.name}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5"/>{area.location}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${area.status === "ADOPTED" ? "bg-emerald-100 text-emerald-700" : area.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {area.status}
                  </span>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Duration</p>
                    <p className="text-sm font-semibold text-slate-700">{area.durationMonths} Months</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Maintenance Plan</p>
                    <p className="text-sm text-slate-700">{area.maintenancePlan}</p>
                  </div>
                </div>

                {area.status === "ADOPTED" && (
                  <div className="pt-4 border-t border-slate-100 flex gap-2">
                    <button onClick={() => setActiveTab("drives")} className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold py-2 rounded-xl transition-colors">
                      Host Drive Here
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {myAdoptedAreas.length === 0 && (
               <div className="col-span-1 lg:col-span-2 text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
                 <MapPin className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                 <h3 className="text-lg font-bold text-slate-700 mb-2">No Adopted Areas Yet</h3>
                 <p className="text-slate-500 text-sm">Adopt a park, street, or public space to organize recurring drives and earn extra trust points.</p>
               </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// ── Shared Components ───────────────────────────────────────────────────
function DriveCard({ drive, showOrg = true, onClick }: { drive: Drive; showOrg?: boolean; onClick?: () => void }) {
  const statusColors: Record<string, string> = {
    OPEN: "bg-emerald-100 text-emerald-700",
    COMPLETED: "bg-blue-100 text-blue-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  const CATEGORY_ICONS: Record<string, string> = {
    "Cleanliness": "🧹", "Tree Plantation": "🌳", "Plastic Collection": "♻️",
    "Animal Welfare": "🐾", "Awareness Campaign": "📣", "Wall Painting": "🎨",
    "Park Cleaning": "🏞️", "Lake Cleaning": "💧", "River Cleaning": "🌊",
    "Public Health": "🏥", "Waste Segregation": "🗂️", "Other": "⭐"
  };

  return (
    <div onClick={onClick} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">{CATEGORY_ICONS[drive.category] || "⭐"}</div>
          <div>
            <h3 className="font-bold text-slate-900">{drive.title}</h3>
            {showOrg && drive.orgName && <p className="text-xs text-slate-400 mt-0.5">by {drive.orgName}</p>}
          </div>
        </div>
        <span className={`${statusColors[drive.status] || "bg-slate-100 text-slate-600"} text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0`}>
          {drive.status}
        </span>
      </div>

      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{drive.description}</p>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-4">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{drive.city}, {drive.state}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{new Date(drive.date).toLocaleDateString("en-IN")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{drive.time}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{drive.joinedVolunteers}/{drive.requiredVolunteers} volunteers</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{drive.category}</span>
        <span className="text-slate-400 text-xs">{drive.address}</span>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, message, badge }: {
  icon: React.ReactNode; title: string; message: string; badge?: string;
}) {
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 animate-fade-in">
      <div className="text-slate-200 flex justify-center mb-4">{icon}</div>
      <h3 className="font-bold text-slate-700 mb-2">{title}</h3>
      <p className="text-slate-400 text-sm max-w-xs mx-auto">{message}</p>
      {badge && <span className="inline-block mt-4 bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full">{badge}</span>}
    </div>
  );
}
