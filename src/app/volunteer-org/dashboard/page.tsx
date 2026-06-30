"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  LayoutDashboard, Compass, Calendar, Users, ClipboardList,
  MessageSquare, Trophy, UserCircle, Bell, Settings, LogOut, FileText,
  TrendingUp, Star, MapPin, Clock, ChevronRight, Search,
  Filter, CheckCircle2, AlertCircle, Building2, Menu, X,
  Shield, Activity, Zap, Heart, RefreshCw, Eye, Edit3,
  Phone, Mail, Globe, Camera, Plus, Award, Leaf, Trash2, ArrowRight, Download, Target, UserCheck
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { ModalPortal } from "@/components/ModalPortal";

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
  orgId?: string;
  acceptedOrgId?: string;
  orgRequests?: any[];
  partnerRequests?: any[];
  supportingOrgs?: any[];
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

type Tab = "dashboard" | "drives" | "members" | "certificates" | "profile" | "notifications" | "settings";

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
  const [isEditCapacityModalOpen, setIsEditCapacityModalOpen] = useState(false);
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

  // Partner Flow
  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false);
  const [availablePartners, setAvailablePartners] = useState<OrgProfile[]>([]);
  const [fetchingPartners, setFetchingPartners] = useState(false);

  // Profile edit
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<OrgProfile>>({});
  const [editSaving, setEditSaving] = useState(false);

  // Calculate dynamic trust score
  const computedTrustScore = useMemo(() => {
    if (!org) return 0;
    let score = 50; // Base score
    if (org.verifiedBy) score += 20; // +20 if verified
    
    // +5 for each completed drive
    const completedDrives = myDrives.filter(d => d.status === 'COMPLETED').length;
    score += completedDrives * 5;
    
    // -10 for each cancelled drive
    const cancelledDrives = myDrives.filter(d => d.status === 'CANCELLED').length;
    score -= cancelledDrives * 10;
    
    // -15 for each overdue drive
    const overdueDrives = myDrives.filter(d => d.status === 'OVERDUE').length;
    score -= overdueDrives * 15;
    
    // +2 for each active member
    const activeMembersCount = org.members ? org.members.filter((m: any) => m.status === 'member').length : (org.activeMembers || 0);
    score += activeMembersCount * 2;
    
    return Math.max(0, Math.min(100, score)); // clamp between 0 and 100
  }, [org, myDrives]);


  // Settings
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Create Independent Drive
  const [isCreateDriveModalOpen, setIsCreateDriveModalOpen] = useState(false);
  const [driveTitle, setDriveTitle] = useState("");
  const [driveDescription, setDriveDescription] = useState("");
  const [driveCategory, setDriveCategory] = useState("Cleanliness");
  const [driveDate, setDriveDate] = useState("");
  const [driveTime, setDriveTime] = useState("");
  const [driveDuration, setDriveDuration] = useState<number>(2);
  const [driveReqVol, setDriveReqVol] = useState<number>(10);
  const [driveMaxVol, setDriveMaxVol] = useState<number>(20);
  const [driveMeetingLoc, setDriveMeetingLoc] = useState("");
  const [driveInstructions, setDriveInstructions] = useState("");
  const [driveCreating, setDriveCreating] = useState(false);
  const [driveCoverImage, setDriveCoverImage] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 })
        });
        if (res.ok) {
          const data = await res.json();
          setDriveCoverImage(data.url);
        }
      } catch (err) {
        console.error("Upload error", err);
      } finally {
        setIsUploading(false);
      }
    };
  };

  const handleCreateIndependentDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setDriveCreating(true);
    try {
      const res = await fetch("/api/community-drives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isIndependentOrgDrive: true,
          orgId: org._id,
          title: driveTitle,
          description: driveDescription,
          category: driveCategory,
          date: driveDate,
          time: driveTime,
          durationHours: driveDuration,
          requiredVolunteers: driveReqVol,
          maxVolunteers: driveMaxVol,
          meetingLocation: driveMeetingLoc,
          instructions: driveInstructions,
          coverImage: driveCoverImage,
        })
      });
      if (res.ok) {
        setIsCreateDriveModalOpen(false);
        setDriveTitle(""); setDriveDescription(""); setDriveMeetingLoc(""); setDriveInstructions(""); setDriveCoverImage("");
        loadData(); // refresh drives
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create drive");
      }
    } catch (e) {
      console.error(e);
      alert("Error creating drive");
    } finally {
      setDriveCreating(false);
    }
  };

  const [isScheduleDriveModalOpen, setIsScheduleDriveModalOpen] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const handleScheduleDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrive) return;
    setScheduleLoading(true);
    try {
      const res = await fetch(`/api/community-drives/${selectedDrive._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule_drive",
          date: driveDate,
          time: driveTime,
          durationHours: driveDuration,
          requiredVolunteers: driveReqVol,
          maxVolunteers: driveMaxVol,
          meetingLocation: driveMeetingLoc,
          coverImage: driveCoverImage,
        })
      });
      if (res.ok) {
        setIsScheduleDriveModalOpen(false);
        handleRefresh();
        setSelectedDrive(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to schedule drive");
      }
    } catch (e) {
      alert("Error scheduling drive");
    } finally {
      setScheduleLoading(false);
    }
  };

  const [isEditDriveModalOpen, setIsEditDriveModalOpen] = useState(false);
  const [editDriveLoading, setEditDriveLoading] = useState(false);

  const handleEditDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrive) return;
    setEditDriveLoading(true);
    try {
      const res = await fetch(`/api/community-drives/${selectedDrive._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit_drive",
          title: driveTitle,
          description: driveDescription,
          date: driveDate,
          time: driveTime,
          durationHours: driveDuration,
          meetingLocation: driveMeetingLoc,
          instructions: driveInstructions
        })
      });
      if (res.ok) {
        setIsEditDriveModalOpen(false);
        handleRefresh();
        setSelectedDrive(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to edit drive");
      }
    } catch (e) {
      alert("Error editing drive");
    } finally {
      setEditDriveLoading(false);
    }
  };

  const openPartnerModal = async () => {
     if (!org?.state) return alert("Organization state missing.");
     setIsAddPartnerModalOpen(true);
     setFetchingPartners(true);
     try {
        const res = await fetch(`/api/volunteer-org?state=${org.state}&status=VERIFIED`);
        if (res.ok) {
           const data = await res.json();
           const others = data.filter((o: any) => o._id !== org._id);
           setAvailablePartners(others);
        } else {
           const e = await res.json();
           alert("Failed to fetch partners: " + (e.error || "Unknown error"));
        }
     } catch(e: any) {
        alert("Network error: " + e.message);
        console.error(e);
     } finally {
        setFetchingPartners(false);
     }
  };

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

  // -- SCROLL LOCK FOR MODALS --
  useEffect(() => {
    if (
      selectedDrive ||
      showCompletionModal ||
      isEditCapacityModalOpen ||
      isAddPartnerModalOpen ||
      isCreateDriveModalOpen ||
      isScheduleDriveModalOpen ||
      isEditDriveModalOpen
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [
    selectedDrive,
    showCompletionModal,
    isEditCapacityModalOpen,
    isAddPartnerModalOpen,
    isCreateDriveModalOpen,
    isScheduleDriveModalOpen,
    isEditDriveModalOpen
  ]);

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
        <div className="max-w-lg w-full bg-white rounded-sm border border-amber-200 shadow-xl p-10 text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-amber-200">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Pending</h1>
          <p className="text-slate-500 mb-6 text-sm">
            Your organization <span className="font-bold text-slate-900">{org.name}</span> is awaiting admin verification.
            You'll receive a notification once approved.
          </p>
          <div className="bg-[#F4F9F5] rounded-sm p-4 text-left space-y-2 mb-6 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-semibold">{org.type}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">City</span><span className="font-semibold">{org.city}, {org.state}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">PENDING VERIFICATION</span></div>
          </div>
          <button onClick={logoutMock} className="w-full bg-slate-900 text-white font-bold py-3 rounded-sm flex items-center justify-center gap-2">
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
        <div className="max-w-lg w-full bg-white rounded-sm border border-red-200 shadow-xl p-10 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-200">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Rejected</h1>
          <p className="text-slate-500 text-sm mb-4">Your organization was not approved.</p>
          {org.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-6 text-left">
              <p className="text-red-700 text-sm font-semibold">Reason:</p>
              <p className="text-red-600 text-sm mt-1">{org.rejectionReason}</p>
            </div>
          )}
          <button onClick={logoutMock} className="w-full bg-slate-900 text-white font-bold py-3 rounded-sm">Sign Out</button>
        </div>
      </div>
    );
  }

  // Suspended
  if (org && org.status === "SUSPENDED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-white p-4">
        <div className="max-w-lg w-full bg-white rounded-sm border border-emerald-100 shadow-xl p-10 text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-slate-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Organization Suspended</h1>
          <p className="text-slate-500 text-sm mb-6">Contact your administrator for more information.</p>
          <button onClick={logoutMock} className="w-full bg-slate-900 text-white font-bold py-3 rounded-sm">Sign Out</button>
        </div>
      </div>
    );
  }


  // Prompt 2: First Login Password Gate
  if (org && org.mustChangePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
        <div className="max-w-md w-full bg-white rounded-sm border border-indigo-200 shadow-xl p-10 text-center">
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
              <input type="password" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full border border-emerald-100 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Confirm New Password</label>
              <input type="password" required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full border border-emerald-100 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {pwMsg && <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-sm">{pwMsg}</p>}
            <button type="submit" disabled={editSaving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-sm transition-colors">
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
    { id: "drives", label: "Drives", icon: <Compass className="w-4 h-4" /> },
    { id: "members", label: "Members", icon: <Users className="w-4 h-4" /> },
    { id: "certificates", label: "Certificates", icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: "profile", label: "Profile", icon: <Settings className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" />, badge: unreadCount },
  ];

  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-[100] w-64 bg-slate-900 transform transition-transform duration-300 flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>
      {/* Brand */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {org?.logoUrl ? (
            <img src={org.logoUrl} alt="Logo" className="w-10 h-10 rounded-sm object-cover" />
          ) : (
            <div className="w-10 h-10 bg-emerald-600 rounded-sm flex items-center justify-center">
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
          <span className="text-emerald-400 font-bold text-xs">{computedTrustScore}/100</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full transition-all"
            style={{ width: `${computedTrustScore}%` }}
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-all ${
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
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-slate-400 hover:text-white hover:bg-red-900/30 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100dvh-4rem)] bg-[#F4F9F5] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-emerald-100 px-4 py-3 flex items-center justify-between">
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
                <div className="relative rounded-sm overflow-hidden h-36">
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
                  { label: "Trust Score", value: `${computedTrustScore}/100`, icon: <Star className="w-5 h-5 text-amber-500" />, color: "bg-amber-50 border-amber-100" },
                  { label: "Active Members", value: org?.activeMembers ?? 0, icon: <Users className="w-5 h-5 text-purple-600" />, color: "bg-purple-50 border-purple-100" },
                ].map((kpi, i) => (
                  <div key={i} className={`${kpi.color} border rounded-sm p-4 flex items-start gap-3`}>
                    <div className="bg-white rounded-sm p-2 shadow-sm">{kpi.icon}</div>
                    <div>
                      <p className="text-slate-500 text-xs">{kpi.label}</p>
                      <p className="text-slate-900 font-bold text-xl">{kpi.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-sm border border-emerald-100 p-5">
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
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-semibold ${action.color} transition-all text-left`}
                      >
                        {action.icon} {action.label} <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Notifications */}
                <div className="bg-white rounded-sm border border-emerald-100 p-5">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-500" /> Recent Notifications
                    {unreadCount > 0 && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount} new</span>}
                  </h3>
                  {notifications.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">No notifications yet</p>
                  ) : (
                    <div className="space-y-2">
                      {notifications.slice(0, 4).map(n => (
                        <div key={n._id} className={`p-3 rounded-sm text-xs ${n.isRead ? "bg-[#F4F9F5]" : "bg-emerald-50 border border-emerald-100"}`}>
                          <p className="font-semibold text-slate-800">{n.title}</p>
                          <p className="text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      ))}
                      <button onClick={() => setActiveTab("notifications")} className="text-emerald-600 text-xs font-semibold hover:underline">View all →</button>
                    </div>
                  )}
                </div>

                {/* Organization Info */}
                <div className="bg-white rounded-sm border border-emerald-100 p-5">
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

          {/* ── DRIVES ─────────────────────────────────────── */}
          {activeTab === "drives" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-black text-slate-900">Manage Drives</h2>
                 <button onClick={() => setIsCreateDriveModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-sm flex items-center gap-2 transition-colors shadow-sm">
                   <Plus className="w-4 h-4" /> Create Independent Drive
                 </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                 {/* Drive Requests (from Admin) */}
                 <div>
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                       <Shield className="w-5 h-5 text-amber-500" /> Drive Requests (from Admin)
                    </h3>
                    {filteredDrives.length === 0 ? (
                       <div className="bg-white border border-emerald-100 rounded-sm p-8 text-center">
                          <Compass className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                          <p className="text-slate-500 text-sm font-medium">No available drive requests.</p>
                       </div>
                    ) : (
                       <div className="space-y-4">
                          {filteredDrives.map(drive => (
                             <DriveCard key={drive._id} drive={drive} onClick={() => setSelectedDrive(drive)} />
                          ))}
                       </div>
                    )}
                 </div>

                 {/* My Independent Drives & Partnerships */}
                 <div className="space-y-8">
                    {/* Partner Invitations */}
                    {myDrives.some(d => d.partnerRequests?.some((pr: any) => pr.orgId === org?._id && pr.status === "pending")) && (
                       <div>
                          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                             <Shield className="w-5 h-5 text-indigo-500" /> Partnership Invitations
                          </h3>
                          <div className="space-y-4">
                             {myDrives.filter(d => d.partnerRequests?.some((pr: any) => pr.orgId === org?._id && pr.status === "pending")).map(drive => (
                                <DriveCard key={drive._id} drive={drive} showOrg={false} onClick={() => setSelectedDrive(drive)} />
                             ))}
                          </div>
                       </div>
                    )}

                    {/* My Drives */}
                    <div>
                       <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-emerald-500" /> My Drives & Supported Drives
                       </h3>
                       {myDrives.filter(d => !d.partnerRequests?.some((pr: any) => pr.orgId === org?._id && pr.status === "pending")).length === 0 ? (
                          <div className="bg-white border border-emerald-100 rounded-sm p-8 text-center">
                             <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                             <p className="text-slate-500 text-sm font-medium">No active drives found.</p>
                          </div>
                       ) : (
                          <div className="space-y-4">
                             {myDrives.filter(d => !d.partnerRequests?.some((pr: any) => pr.orgId === org?._id && pr.status === "pending")).map(drive => (
                                <DriveCard key={drive._id} drive={drive} showOrg={false} onClick={() => setSelectedDrive(drive)} />
                             ))}
                          </div>
                       )}
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* ── MEMBERS ─────────────────────────────────────────────── */}
          {activeTab === "members" && (
             <div className="space-y-8 animate-fade-in">
                {/* Pending Requests */}
                <div>
                   <h2 className="text-xl font-black text-slate-900 mb-1">Community Hero Volunteer Requests</h2>
                   <p className="text-sm text-slate-500 mb-4">Volunteers from the Community Hero platform who want to join your missions.</p>
                   {(!org?.members || org.members.filter(m => m.status === 'pending').length === 0) ? (
                      <div className="bg-white border border-emerald-100 rounded-sm p-8 text-center">
                         <Shield className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                         <p className="text-slate-500 text-sm font-medium">No new Community Hero volunteers have requested to join at the moment.</p>
                      </div>
                   ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                         {org.members.filter(m => m.status === 'pending').map((m: any) => (
                            <div key={m.email} className="bg-white border border-emerald-100 rounded-sm p-5 shadow-sm">
                               <p className="font-bold text-slate-900">{m.name}</p>
                               <p className="text-xs text-slate-500 mb-3">{m.email} • {m.phone}</p>
                               <div className="bg-[#F4F9F5] p-3 rounded-sm mb-4">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Motivation</p>
                                  <p className="text-xs text-slate-700 italic">"{m.motivation}"</p>
                               </div>
                               <div className="flex gap-2">
                                  <button onClick={async () => {
                                     const res = await fetch(`/api/volunteer-org/${org._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve_member', email: m.email }) });
                                     if(res.ok) handleRefresh();
                                  }} className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold py-2 rounded-sm transition-colors">Approve</button>
                                  <button onClick={async () => {
                                     const res = await fetch(`/api/volunteer-org/${org._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject_member', email: m.email }) });
                                     if(res.ok) handleRefresh();
                                  }} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-2 rounded-sm transition-colors">Reject</button>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>

                {/* Active Members Directory */}
                <div>
                   <h2 className="text-xl font-black text-slate-900 mb-1">Community Hero Volunteer Directory</h2>
                   <p className="text-sm text-slate-500 mb-4">Active platform users who are officially part of your organization.</p>
                   <div className="bg-white border border-emerald-100 rounded-sm overflow-hidden shadow-sm max-h-[400px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left text-sm">
                         <thead className="bg-[#F4F9F5] border-b border-emerald-100">
                            <tr>
                               <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Member</th>
                               <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Contact</th>
                               <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Skills</th>
                               <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Joined</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {(!org?.members || org.members.filter(m => m.status === 'member').length === 0) ? (
                               <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No Community Hero volunteers have joined yet.</td></tr>
                            ) : (
                               org.members.filter(m => m.status === 'member').map((m: any) => (
                                  <tr key={m.email} className="hover:bg-[#F4F9F5] transition-colors">
                                     <td className="px-6 py-4 font-semibold text-slate-900">{m.name}</td>
                                     <td className="px-6 py-4 text-slate-500">{m.email}<br/><span className="text-xs">{m.phone}</span></td>
                                     <td className="px-6 py-4 text-slate-500 text-xs max-w-[200px] truncate">{m.skills}</td>
                                     <td className="px-6 py-4 text-slate-500 text-xs">{new Date(m.joinedAt).toLocaleDateString()}</td>
                                  </tr>
                               ))
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          )}

          {/* ── CERTIFICATES ─────────────────────────────────────────────── */}
          {activeTab === "certificates" && (
             <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-end mb-6">
                   <div>
                      <h2 className="text-2xl font-black text-slate-900">Issue Certificates</h2>
                      <p className="text-slate-500 font-medium mt-1">Generate AI-powered certificates for completed drives and email them to volunteers.</p>
                   </div>
                </div>
                
                {completedDrives.length === 0 ? (
                   <div className="bg-white rounded-sm border border-emerald-100 shadow-sm p-16 text-center">
                      <CheckCircle2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-500 font-medium">Complete a drive with registered volunteers to issue certificates.</p>
                   </div>
                ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {completedDrives.map(drive => {
                         const approvedVolunteers = drive.volunteers?.filter(v => v.status === "approved") || [];
                         return (
                            <div key={drive._id} className="bg-white border border-emerald-100 rounded-sm p-6 shadow-sm flex flex-col">
                               <div className="flex justify-between items-start mb-4">
                                  <div>
                                     <h3 className="text-base font-bold text-slate-900 line-clamp-1">{drive.title}</h3>
                                     <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{new Date(drive.date).toLocaleDateString()} • {drive.city}</p>
                                  </div>
                                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">{approvedVolunteers.length} Approved</span>
                               </div>

                               {approvedVolunteers.length > 0 ? (
                                  <div className="bg-[#F4F9F5] rounded-sm p-4 flex-1">
                                     <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3">Eligible Volunteers</h4>
                                     <div className="space-y-2">
                                        {approvedVolunteers.map(v => (
                                           <div key={v.email} className="flex justify-between items-center bg-white p-3 border border-emerald-100 rounded-sm">
                                              <div className="min-w-0 pr-2">
                                                 <p className="text-sm font-semibold text-slate-900 truncate">{v.name}</p>
                                                 <p className="text-[10px] text-slate-400 truncate">{v.email}</p>
                                              </div>
                                              <button onClick={async (e) => {
                                                 const btn = e.currentTarget;
                                                 btn.disabled = true;
                                                 btn.innerHTML = "Generating & Sending...";
                                                 try {
                                                    const res = await fetch('/api/generate-certificate', {
                                                       method: 'POST',
                                                       headers: {'Content-Type': 'application/json'},
                                                       body: JSON.stringify({ driveId: drive._id, volunteerEmail: v.email })
                                                    });
                                                    if(res.ok) {
                                                       btn.innerHTML = "✓ Sent";
                                                       btn.classList.replace("bg-indigo-600", "bg-emerald-100");
                                                       btn.classList.replace("text-white", "text-emerald-700");
                                                    } else {
                                                       const data = await res.json();
                                                       btn.innerHTML = "Failed";
                                                       btn.disabled = false;
                                                       alert("Error: " + data.error);
                                                    }
                                                 } catch(e: any) {
                                                    btn.innerHTML = "Error";
                                                    btn.disabled = false;
                                                    alert("Network Error");
                                                 }
                                              }} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-sm transition-colors flex-shrink-0">
                                                 Generate & Send
                                              </button>
                                           </div>
                                        ))}
                                     </div>
                                  </div>
                               ) : (
                                  <div className="bg-[#F4F9F5] rounded-sm p-4 flex-1 flex items-center justify-center">
                                     <p className="text-xs text-slate-400 italic text-center">No approved volunteers found.</p>
                                  </div>
                               )}
                            </div>
                         );
                      })}
                   </div>
                )}
             </div>
          )}

          {/* ── PROFILE ─────────────────────────────────────────────── */}

          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in pb-12">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Organization Profile</h2>
                  <p className="text-slate-500 font-medium mt-1">Official registry and operational details.</p>
                </div>
                <button
                  onClick={() => { setEditMode(!editMode); setEditForm(org || {}); }}
                  className="flex items-center gap-2 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-800 font-bold text-[11px] uppercase tracking-wider px-4 py-2 rounded-none transition-all shadow-sm"
                >
                  <Edit3 className="w-4 h-4" /> {editMode ? "Cancel Editing" : "Modify Record"}
                </button>
              </div>

              {/* Cover & Master Info Container */}
              <div className="bg-white border border-emerald-100 rounded-none shadow-sm overflow-hidden">
                <div className="h-48 bg-emerald-950 relative border-b border-emerald-900">
                  {org?.coverImageUrl && <img src={org.coverImageUrl} alt="Cover" className="w-full h-full object-cover opacity-80 mix-blend-overlay" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent"></div>
                  
                  {/* Absolute Info on Cover */}
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                     <div className="flex items-end gap-6">
                       <div className="w-24 h-24 border-2 border-emerald-500 bg-white flex items-center justify-center p-2 shadow-lg">
                          {org?.logoUrl
                            ? <img src={org.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            : <Building2 className="w-12 h-12 text-emerald-900" />
                          }
                       </div>
                       <div className="pb-2">
                         <div className="flex items-center gap-3 mb-2">
                            <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-none shadow-sm border border-emerald-400">Verified Entity</span>
                            {org?.verifiedBy && (
                               <span className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider flex items-center gap-1">
                                  <Shield className="w-3 h-3 text-emerald-400"/> Authenticated by {org.verifiedBy}
                               </span>
                            )}
                         </div>
                         <h2 className="text-3xl font-black text-white tracking-tight leading-none shadow-sm">{org?.name}</h2>
                       </div>
                     </div>
                  </div>
                </div>

                <div className="p-0">
                  {editMode ? (
                    <div className="p-8 space-y-6 bg-slate-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Registered Entity Name</label>
                          <input type="text" value={editForm.name || ""} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full border-2 border-emerald-100 bg-white rounded-none px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Primary Contact Phone</label>
                          <input type="tel" value={editForm.contactPhone || ""} onChange={e => setEditForm(f => ({ ...f, contactPhone: e.target.value }))}
                            className="w-full border-2 border-emerald-100 bg-white rounded-none px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none transition-colors" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Operational Description</label>
                          <textarea rows={3} value={editForm.description || ""} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                            className="w-full border-2 border-emerald-100 bg-white rounded-none px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none resize-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Core Mission Statement</label>
                          <textarea rows={2} value={editForm.mission || ""} onChange={e => setEditForm(f => ({ ...f, mission: e.target.value }))}
                            className="w-full border-2 border-emerald-100 bg-white rounded-none px-4 py-2.5 text-sm font-medium text-emerald-900 focus:border-emerald-500 focus:outline-none resize-none" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Official Portal (Website)</label>
                          <input type="url" value={editForm.website || ""} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
                            className="w-full border-2 border-emerald-100 bg-white rounded-none px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Liaison Officer</label>
                          <input type="text" value={editForm.contactPersonName || ""} onChange={e => setEditForm(f => ({ ...f, contactPersonName: e.target.value }))}
                            className="w-full border-2 border-emerald-100 bg-white rounded-none px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none transition-colors" />
                        </div>
                      </div>
                      <div className="border-t border-slate-200 pt-6">
                        <button onClick={handleSaveProfile} disabled={editSaving}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] uppercase tracking-wider px-8 py-3 rounded-none flex items-center justify-center gap-2 disabled:opacity-60 transition-colors w-full sm:w-auto">
                          {editSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Commit Changes to Registry
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-emerald-100 border-b border-emerald-100 bg-emerald-50/30">
                        <div className="p-6">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Shield className="w-3 h-3 text-emerald-600"/> Registration No.</p>
                          <p className="font-black text-slate-900 text-xl tracking-tight">{org?.registrationNumber || "PENDING"}</p>
                        </div>
                        <div className="p-6">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Users className="w-3 h-3 text-emerald-600"/> Community Volunteers</p>
                          <p className="font-black text-slate-900 text-xl tracking-tight">{org?.members ? org.members.filter(m => m.status === 'member').length : (org?.activeMembers || 0)}</p>
                        </div>
                        <div className="p-6">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Award className="w-3 h-3 text-emerald-600"/> Trust Score</p>
                          <div className="flex items-end gap-1">
                             <p className="font-black text-emerald-700 text-xl tracking-tight">{computedTrustScore}</p>
                             <p className="font-bold text-slate-400 text-sm mb-0.5">/100</p>
                          </div>
                        </div>
                        <div className="p-6">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><MapPin className="w-3 h-3 text-emerald-600"/> Jurisdiction</p>
                          <p className="font-black text-slate-900 text-sm">{org?.city}</p>
                          <p className="font-bold text-slate-500 text-xs">{org?.state}</p>
                        </div>
                      </div>

                      {/* Details Section */}
                      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-12">
                         <div className="md:col-span-2 space-y-8">
                            <div>
                               <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Operational Overview</h3>
                               <p className="text-slate-700 text-sm leading-relaxed font-medium">{org?.description || "No operational description provided."}</p>
                            </div>
                            
                            {org?.mission && (
                              <div className="bg-emerald-950 border border-emerald-900 rounded-none p-6 shadow-inner relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                   <Target className="w-24 h-24 text-emerald-500" />
                                </div>
                                <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 relative z-10">Core Mission Directive</h3>
                                <p className="text-emerald-50 text-sm font-medium leading-relaxed relative z-10 italic">"{org.mission}"</p>
                              </div>
                            )}
                         </div>

                         <div className="space-y-8">
                            <div>
                               <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Registered Capabilities</h3>
                               <div className="flex flex-col gap-2">
                                 {org?.workCategories?.map(cat => (
                                   <div key={cat} className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-none flex items-center gap-2 shadow-sm">
                                     <span className="text-emerald-600">{CATEGORY_ICONS[cat]}</span> {cat}
                                   </div>
                                 ))}
                                 {(!org?.workCategories || org.workCategories.length === 0) && (
                                   <p className="text-xs text-slate-400 italic">No capabilities registered.</p>
                                 )}
                               </div>
                            </div>
                            
                            <div>
                               <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Contact Matrix</h3>
                               <div className="space-y-3">
                                  {org?.contactPersonName && (
                                    <div className="flex items-start gap-3">
                                      <UserCheck className="w-4 h-4 text-emerald-600 mt-0.5" />
                                      <div>
                                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Liaison Officer</p>
                                         <p className="text-xs font-bold text-slate-800">{org.contactPersonName}</p>
                                      </div>
                                    </div>
                                  )}
                                  {org?.contactPhone && (
                                    <div className="flex items-start gap-3">
                                      <Phone className="w-4 h-4 text-emerald-600 mt-0.5" />
                                      <div>
                                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Emergency Contact</p>
                                         <p className="text-xs font-bold text-slate-800">{org.contactPhone}</p>
                                      </div>
                                    </div>
                                  )}
                                  {org?.website && (
                                    <div className="flex items-start gap-3">
                                      <Globe className="w-4 h-4 text-emerald-600 mt-0.5" />
                                      <div>
                                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Official Portal</p>
                                         <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-600 hover:underline">{org.website.replace(/^https?:\/\//, '')}</a>
                                      </div>
                                    </div>
                                  )}
                               </div>
                            </div>
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
              <div className="bg-white rounded-sm border border-emerald-100">
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
                        className={`p-4 cursor-pointer hover:bg-[#F4F9F5] transition-colors ${!n.isRead ? "bg-emerald-50/50" : ""}`}
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
              <div className="bg-white rounded-sm border border-emerald-100 p-6">
                <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-500" /> Change Password
                </h2>
                {pwMsg && (
                  <div className={`text-sm font-semibold mb-4 p-3 rounded-sm ${pwMsg.includes("success") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {pwMsg}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      className="w-full border border-emerald-100 rounded-sm px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full border border-emerald-100 rounded-sm px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
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
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-sm transition-all"
                  >
                    Update Password
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-sm border border-emerald-100 p-6">
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

              <button onClick={logoutMock} className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 rounded-sm transition-all border border-red-200">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── DRIVE DASHBOARD MODAL ── */}
      {selectedDrive && (
         <ModalPortal>
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6">
           <div className="absolute inset-0" onClick={() => setSelectedDrive(null)}></div>
           <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative z-10 overflow-hidden">
             
             {/* Header */}
             <div className="bg-[#F4F9F5] border-b border-slate-100 p-6 flex justify-between items-start shrink-0">
                <div>
                   <h2 className="text-2xl font-black text-slate-900">{selectedDrive.title}</h2>
                   <div className="flex items-center gap-3 mt-2 text-xs font-bold">
                     <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-wider">{selectedDrive.status.replace(/_/g, " ")}</span>
                     <span className="text-slate-500 uppercase flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(selectedDrive.date).toLocaleDateString()}</span>
                     <span className="text-slate-500 uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> {selectedDrive.time}</span>
                   </div>
                </div>
                <button onClick={() => setSelectedDrive(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-emerald-50 rounded-full transition-colors"><X className="w-5 h-5"/></button>
             </div>

             <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-3 gap-6">
                   {/* Main Info */}
                   <div className="col-span-2 space-y-6">
                      <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 p-5 rounded-sm shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full mix-blend-multiply opacity-50 -mr-10 -mt-10 blur-2xl"></div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 relative z-10">
                           <FileText className="w-4 h-4 text-slate-300" /> Description
                        </h3>
                        <p className="text-[15px] font-medium text-slate-700 leading-relaxed relative z-10 whitespace-pre-wrap">{selectedDrive.description}</p>
                      </div>



                     {/* Registered Volunteers */}
                      {(selectedDrive.orgId === org?._id || selectedDrive.acceptedOrgId === org?._id) && selectedDrive.volunteers && selectedDrive.volunteers.length > 0 && (
                         <div className="mt-8">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Registered Volunteers ({(selectedDrive.volunteers?.filter((v: any) => v.status !== 'rejected').length) || selectedDrive.joinedVolunteers}/{selectedDrive.maxVolunteers || selectedDrive.requiredVolunteers})</h3>
                            <div className="bg-white border border-emerald-100 rounded-sm shadow-sm overflow-y-auto max-h-64 custom-scrollbar">
                               <table className="w-full text-left border-collapse">
                                  <thead>
                                     <tr className="bg-[#F4F9F5] border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Contact</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                     </tr>
                                  </thead>
                                  <tbody>
                                     {selectedDrive.volunteers.map((vol, i) => (
                                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-[#F4F9F5]/50">
                                           <td className="p-4">
                                              <p className="font-bold text-slate-900 text-sm">{vol.name}</p>
                                              <p className="text-xs text-slate-500">Age: {vol.age}</p>
                                           </td>
                                           <td className="p-4 text-sm text-slate-600">
                                              <p>{vol.email}</p>
                                              <p>{vol.phone}</p>
                                           </td>
                                           <td className="p-4">
                                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${vol.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : vol.status === 'rejected' ? 'bg-red-100 text-red-700' : vol.status === 'present' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                                 {vol.status}
                                              </span>
                                           </td>
                                           <td className="p-4 text-right flex gap-2 justify-end">
                                              {vol.status === 'pending' && (
                                                 <>
                                                   <button onClick={async() => {
                                                      setActionLoading(true);
                                                      try {
                                                         const res = await fetch(`/api/community-drives/${selectedDrive._id}`, {
                                                            method: "PATCH", headers: {"Content-Type":"application/json"},
                                                            body: JSON.stringify({ action: "volunteer_approve", email: vol.email })
                                                         });
                                                         if (res.ok) { handleRefresh(); setSelectedDrive(null); }
                                                         else { alert("Failed or capacity reached"); }
                                                      } finally { setActionLoading(false); }
                                                   }} className="text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3 py-1.5 rounded-sm transition-colors">Approve</button>
                                                   <button onClick={async() => {
                                                      setActionLoading(true);
                                                      try {
                                                         const res = await fetch(`/api/community-drives/${selectedDrive._id}`, {
                                                            method: "PATCH", headers: {"Content-Type":"application/json"},
                                                            body: JSON.stringify({ action: "volunteer_reject", email: vol.email })
                                                         });
                                                         if (res.ok) { handleRefresh(); setSelectedDrive(null); }
                                                      } finally { setActionLoading(false); }
                                                   }} className="text-xs font-bold bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 rounded-sm transition-colors">Reject</button>
                                                 </>
                                              )}
                                           </td>
                                        </tr>
                                     ))}
                                  </tbody>
                               </table>
                            </div>
                         </div>
                      )}
                   </div>

                   {/* Sidebar Info */}
                   <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-100 rounded-sm p-4">
                         <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-1"><MapPin className="w-4 h-4"/> Location</h3>
                         <p className="text-sm text-blue-900 font-medium">{selectedDrive.meetingLocation || selectedDrive.address}</p>
                         <p className="text-xs text-blue-700 mt-1">{selectedDrive.city}, {selectedDrive.state}</p>
                      </div>

                      <div className="bg-amber-50 border border-amber-100 rounded-sm p-4">
                         <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-1"><Users className="w-4 h-4"/> Volunteers</h3>
                         <div className="flex items-end gap-1">
                            <span className="text-2xl font-black text-amber-900">{(selectedDrive.volunteers?.filter((v: any) => v.status !== 'rejected').length) || selectedDrive.joinedVolunteers}</span>
                            <span className="text-sm font-bold text-amber-700 mb-1">/ {selectedDrive.maxVolunteers || selectedDrive.requiredVolunteers}</span>
                         </div>
                         <p className="text-xs text-amber-700 mt-1">Required: {selectedDrive.requiredVolunteers}</p>
                      </div>

                      {selectedDrive.instructions && (
                        <div className="bg-purple-50 border border-purple-100 rounded-sm p-4">
                           <h3 className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-1 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Instructions</h3>
                           <p className="text-sm text-purple-900">{selectedDrive.instructions}</p>
                        </div>
                      )}

                      {/* Supporting Organizations */}
                      <div className="bg-emerald-50 border border-emerald-100 rounded-sm p-4">
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

                         {(selectedDrive.orgId === org?._id || selectedDrive.acceptedOrgId === org?._id) && (
                            <button onClick={openPartnerModal} className="w-full bg-emerald-200 hover:bg-emerald-300 text-emerald-900 font-bold py-2 rounded-sm text-xs transition-colors mt-3">
                               Add Partner Org
                            </button>
                         )}

                         {/* Incoming Partner Request Actions */}
                         {selectedDrive.partnerRequests?.some((pr: any) => pr.orgId === org?._id && pr.status === "pending") && (
                            <div className="mt-4 space-y-2">
                               <p className="text-xs font-bold text-emerald-800">You have been invited to partner!</p>
                               <div className="flex gap-2">
                                  <button onClick={async() => {
                                     setActionLoading(true);
                                     try {
                                        await fetch(`/api/community-drives/${selectedDrive._id}`, {
                                           method: "PATCH", headers: {"Content-Type":"application/json"},
                                           body: JSON.stringify({ action: "accept_partner", orgId: org?._id })
                                        });
                                        handleRefresh(); setSelectedDrive(null);
                                     } finally { setActionLoading(false); }
                                  }} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-sm text-xs transition-colors shadow-sm">
                                     Accept Invite
                                  </button>
                                  <button onClick={async() => {
                                     setActionLoading(true);
                                     try {
                                        await fetch(`/api/community-drives/${selectedDrive._id}`, {
                                           method: "PATCH", headers: {"Content-Type":"application/json"},
                                           body: JSON.stringify({ action: "reject_partner", orgId: org?._id })
                                        });
                                        handleRefresh(); setSelectedDrive(null);
                                     } finally { setActionLoading(false); }
                                  }} className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold py-2 rounded-sm text-xs transition-colors shadow-sm">
                                     Decline
                                  </button>
                               </div>
                            </div>
                         )}
                      </div>
                   </div>
                </div>
             </div>

             {/* Footer Actions */}
             <div className="bg-[#F4F9F5] border-t border-slate-100 p-6 flex flex-wrap gap-3 justify-end">
                {(selectedDrive.orgId === org?._id || selectedDrive.acceptedOrgId === org?._id) && !['COMPLETED', 'CANCELLED'].includes(selectedDrive.status) && (
                   <button onClick={() => {
                      setDriveTitle(selectedDrive.title || "");
                      setDriveDescription(selectedDrive.description || "");
                      setDriveDate(selectedDrive.date ? new Date(selectedDrive.date).toISOString().split('T')[0] : "");
                      setDriveTime(selectedDrive.time || "");
                      setDriveDuration(selectedDrive.durationHours || 2);
                      setDriveMeetingLoc(selectedDrive.meetingLocation || selectedDrive.address || "");
                      setDriveInstructions(selectedDrive.instructions || "");
                      setIsEditDriveModalOpen(true);
                   }} className="bg-emerald-50 hover:bg-slate-200 text-slate-800 text-sm font-bold px-6 py-3 rounded-sm transition-colors shadow-sm">
                      Edit Details
                   </button>
                )}
                {selectedDrive.status === "WAITING_FOR_ORG" && (
                   <button onClick={async() => {
                      setActionLoading(true);
                      try {
                        const res = await fetch(`/api/community-drives/${selectedDrive._id}`, {
                           method: "PATCH", headers: {"Content-Type":"application/json"},
                           body: JSON.stringify({ action: "org_accept", orgId: org?._id, orgName: org?.name })
                        });
                        if (res.ok) { 
                           await handleRefresh(); 
                           setSelectedDrive({...selectedDrive, status: "ORG_APPROVED", acceptedOrgId: org?._id});
                           setDriveDate("");
                           setDriveTime("");
                           setDriveDuration(2);
                           setDriveReqVol(10);
                           setDriveMaxVol(20);
                           setDriveMeetingLoc("");
                           setDriveCoverImage("");
                           setIsScheduleDriveModalOpen(true);
                        }
                      } finally { setActionLoading(false); }
                   }} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-6 py-3 rounded-sm transition-colors shadow-sm">
                      {actionLoading ? "Requesting..." : "Take This Drive"}
                   </button>
                )}

                {(selectedDrive.orgId === org?._id || selectedDrive.acceptedOrgId === org?._id) && selectedDrive.status === "ORG_APPROVED" && (
                   <button onClick={() => {
                     setDriveDate("");
                     setDriveTime("");
                     setDriveDuration(2);
                     setDriveReqVol(10);
                     setDriveMaxVol(20);
                     setDriveMeetingLoc("");
                     setDriveCoverImage("");
                     setIsScheduleDriveModalOpen(true);
                   }} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-3 rounded-sm transition-colors shadow-sm">
                      Schedule Drive Details
                   </button>
                )}

                {(selectedDrive.orgId === org?._id || selectedDrive.acceptedOrgId === org?._id) && selectedDrive.status === "VOLUNTEER_REG_OPEN" && (
                   <>
                     <button onClick={() => {
                        setDriveReqVol(selectedDrive.requiredVolunteers || 10);
                        setDriveMaxVol(selectedDrive.maxVolunteers || 20);
                        setIsEditCapacityModalOpen(true);
                     }} className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-bold px-6 py-3 rounded-sm transition-colors shadow-sm">
                        Edit Capacity
                     </button>
                     <button onClick={async() => {
                        setActionLoading(true);
                      try {
                        const res = await fetch(`/api/community-drives/${selectedDrive._id}`, {
                           method: "PATCH", headers: {"Content-Type":"application/json"},
                           body: JSON.stringify({ action: "close_volunteers" })
                        });
                        if (res.ok) { handleRefresh(); setSelectedDrive(null); }
                      } finally { setActionLoading(false); }
                   }} disabled={actionLoading} className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold px-6 py-3 rounded-sm transition-colors shadow-sm">
                      Close Registrations
                   </button>
                   </>
                )}

                {(selectedDrive.orgId === org?._id || selectedDrive.acceptedOrgId === org?._id) && (selectedDrive.status === "REG_CLOSED" || selectedDrive.status === "VOLUNTEER_REG_OPEN") && (
                   <div className="flex w-full">
                      <button onClick={async() => {
                         setActionLoading(true);
                         try {
                           const res = await fetch(`/api/community-drives/${selectedDrive._id}`, {
                              method: "PATCH", headers: {"Content-Type":"application/json"},
                              body: JSON.stringify({ action: "start_drive" })
                           });
                           if (res.ok) { handleRefresh(); setSelectedDrive(null); }
                         } finally { setActionLoading(false); }
                      }} disabled={actionLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-3 rounded-sm transition-colors shadow-sm">
                         Start Drive
                      </button>
                   </div>
                )}

                {(selectedDrive.orgId === org?._id || selectedDrive.acceptedOrgId === org?._id) && selectedDrive.status === "DRIVE_IN_PROGRESS" && (
                   <button onClick={() => {
                      setCompletionData({
                        workPerformed: "", hoursWorked: selectedDrive.durationHours || 0,
                        totalVolunteersPresent: selectedDrive.joinedVolunteers, afterImageUrls: "", videoUrls: "",
                        wasteCollected: 0, treesPlanted: 0, awarenessParticipants: 0, additionalNotes: ""
                      });
                      setShowCompletionModal(true);
                   }} disabled={actionLoading} className="bg-success-600 hover:bg-success-700 text-white text-sm font-bold px-6 py-3 rounded-sm transition-colors shadow-sm">
                      Mark Completed (Submit Proof)
                   </button>
                )}

                {/* Cancel Drive Button */}
                {(selectedDrive.orgId === org?._id || selectedDrive.acceptedOrgId === org?._id) && ["ORG_APPROVED", "VOLUNTEER_REG_OPEN", "REG_CLOSED"].includes(selectedDrive.status) && (
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
                   }} disabled={actionLoading} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-bold px-6 py-3 rounded-sm transition-colors">
                      Request Cancellation
                   </button>
                )}
             </div>
           </div>
         </div>
         </ModalPortal>
      )}

      {/* Completion Modal */}
      {showCompletionModal && selectedDrive && (
         <ModalPortal>
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6">
           <div className="absolute inset-0" onClick={() => setShowCompletionModal(false)}></div>
           <div className="bg-white rounded-none w-full max-w-xl max-h-[90vh] flex flex-col relative z-10 shadow-2xl overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
               <div>
                 <h2 className="text-xl font-bold text-slate-800">Submit Completion Proof</h2>
                 <p className="text-sm text-slate-500">Provide details for {selectedDrive.title}</p>
               </div>
               <button onClick={() => setShowCompletionModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-[#F4F9F5] rounded-full">
                 <X className="w-5 h-5" />
               </button>
             </div>
             <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">Work Performed (Summary) *</label>
                   <textarea required rows={2} value={completionData.workPerformed} onChange={e => setCompletionData({...completionData, workPerformed: e.target.value})} className="w-full bg-[#F4F9F5] border border-emerald-100 rounded-sm px-4 py-3 text-sm focus:ring-2 focus:ring-success-500/20 focus:border-success-500" placeholder="Briefly describe what was accomplished..."></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Total Volunteers Present *</label>
                      <input type="number" required value={completionData.totalVolunteersPresent} onChange={e => setCompletionData({...completionData, totalVolunteersPresent: parseInt(e.target.value)||0})} className="w-full bg-[#F4F9F5] border border-emerald-100 rounded-sm px-4 py-3 text-sm focus:ring-2 focus:ring-success-500/20 focus:border-success-500" />
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Total Hours Worked *</label>
                      <input type="number" required value={completionData.hoursWorked} onChange={e => setCompletionData({...completionData, hoursWorked: parseInt(e.target.value)||0})} className="w-full bg-[#F4F9F5] border border-emerald-100 rounded-sm px-4 py-3 text-sm focus:ring-2 focus:ring-success-500/20 focus:border-success-500" />
                   </div>
                </div>
                <div className="bg-[#F4F9F5] rounded-sm p-4 border border-emerald-100">
                   <h4 className="font-bold text-slate-700 mb-3 text-sm flex items-center gap-2"><Activity className="w-4 h-4"/> Optional Impact Metrics</h4>
                   <div className="grid grid-cols-3 gap-3">
                      <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Waste Collected (kg)</label>
                         <input type="number" value={completionData.wasteCollected} onChange={e => setCompletionData({...completionData, wasteCollected: parseInt(e.target.value)||0})} className="w-full border border-emerald-100 rounded-sm px-3 py-2 text-sm" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Trees Planted</label>
                         <input type="number" value={completionData.treesPlanted} onChange={e => setCompletionData({...completionData, treesPlanted: parseInt(e.target.value)||0})} className="w-full border border-emerald-100 rounded-sm px-3 py-2 text-sm" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">People Reached</label>
                         <input type="number" value={completionData.awarenessParticipants} onChange={e => setCompletionData({...completionData, awarenessParticipants: parseInt(e.target.value)||0})} className="w-full border border-emerald-100 rounded-sm px-3 py-2 text-sm" />
                      </div>
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">After Image URLs (Comma separated) *</label>
                   <input type="text" required value={completionData.afterImageUrls} onChange={e => setCompletionData({...completionData, afterImageUrls: e.target.value})} className="w-full bg-[#F4F9F5] border border-emerald-100 rounded-sm px-4 py-3 text-sm focus:ring-2 focus:ring-success-500/20 focus:border-success-500" placeholder="https://..." />
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">Additional Notes</label>
                   <textarea rows={2} value={completionData.additionalNotes} onChange={e => setCompletionData({...completionData, additionalNotes: e.target.value})} className="w-full bg-[#F4F9F5] border border-emerald-100 rounded-sm px-4 py-3 text-sm focus:ring-2 focus:ring-success-500/20 focus:border-success-500" placeholder="Any challenges faced or special mentions..."></textarea>
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
                      if (res.ok) { 
                         handleRefresh();
                         setShowCompletionModal(false); 
                         setSelectedDrive(null); 
                         setActiveTab("certificates");
                      }
                    } finally { setActionLoading(false); }
                }} disabled={actionLoading} className="w-full bg-success-600 hover:bg-success-700 text-white font-bold py-3 rounded-sm shadow-sm mt-4 transition-colors">
                   {actionLoading ? "Submitting..." : "Submit Proof & Complete"}
                </button>
                <p className="text-xs text-center text-slate-500 mt-4 px-4 leading-relaxed">
                   <strong>Note:</strong> Once completed and verified, you will be able to generate and send official digital certificates to all volunteers from the <span className="font-semibold text-slate-700">Certificates</span> tab.
                </p>
             </div>
           </div>
         </div>
         </ModalPortal>
      )}

      {/* Create Independent Drive Modal */}
      {isCreateDriveModalOpen && (
        <ModalPortal>
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0" onClick={() => setIsCreateDriveModalOpen(false)}></div>
          <div className="bg-white rounded-[1rem] w-full max-w-2xl max-h-[90vh] flex flex-col relative z-10 shadow-2xl animate-fade-in-up overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-surface-900">Create Independent Drive</h2>
              <button onClick={() => setIsCreateDriveModalOpen(false)} className="text-surface-400 hover:text-surface-600 bg-[#F4F9F5] hover:bg-surface-100 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleCreateIndependentDrive} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-sm mb-4 text-sm text-indigo-800">
                <p><strong>Note:</strong> Since your organization is verified, creating a drive here will immediately open it for volunteer registration and publish a Community Post.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-surface-600 mb-1">Drive Title</label>
                  <input required value={driveTitle} onChange={e=>setDriveTitle(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm" placeholder="e.g. Weekend Lake Cleanup" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-surface-600 mb-1">Description & Goal</label>
                  <textarea required rows={3} value={driveDescription} onChange={e=>setDriveDescription(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm resize-none" placeholder="Describe the purpose of this drive..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-600 mb-1">Drive Category</label>
                  <select required value={driveCategory} onChange={e=>setDriveCategory(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm">
                    {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-600 mb-1">Date</label>
                  <input type="date" required value={driveDate} onChange={e=>setDriveDate(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-surface-600 mb-1">Time</label>
                    <input type="time" required value={driveTime} onChange={e=>setDriveTime(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-surface-600 mb-1">Duration (Hrs)</label>
                    <input type="number" required min="1" value={driveDuration} onChange={e=>setDriveDuration(Number(e.target.value))} className="w-full border p-2.5 rounded-sm text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-600 mb-1">Required Volunteers</label>
                  <input type="number" required min="1" value={driveReqVol} onChange={e=>setDriveReqVol(Number(e.target.value))} className="w-full border p-2.5 rounded-sm text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-600 mb-1">Max Volunteers (Cap)</label>
                  <input type="number" required min="1" value={driveMaxVol} onChange={e=>setDriveMaxVol(Number(e.target.value))} className="w-full border p-2.5 rounded-sm text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-surface-600 mb-1">Meeting Location / Address</label>
                  <input required value={driveMeetingLoc} onChange={e=>setDriveMeetingLoc(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm" placeholder="Exact spot to meet" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-surface-600 mb-1">Drive Cover Image</label>
                  <input type="file" accept="image/*" onChange={handleCoverImageChange} className="w-full border p-2.5 rounded-sm text-sm bg-white" />
                  {isUploading && <p className="text-xs text-indigo-600 mt-1 font-bold">Uploading to Cloudinary...</p>}
                  {driveCoverImage && <img src={driveCoverImage} alt="Cover Preview" className="mt-2 w-full h-32 object-cover rounded-sm border border-slate-200" />}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-surface-600 mb-1">Instructions for Volunteers</label>
                  <input value={driveInstructions} onChange={e=>setDriveInstructions(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm" placeholder="e.g. Bring extra gloves, wear comfortable shoes" />
                </div>
              </div>

              <div className="pt-4 border-t border-surface-100 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsCreateDriveModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-surface-600 hover:bg-surface-100 rounded-sm transition-colors">Cancel</button>
                <button type="submit" disabled={driveCreating} className="px-5 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm transition-colors flex items-center gap-2">
                  {driveCreating ? "Publishing..." : <><Globe className="w-4 h-4"/> Publish Independent Drive</>}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Schedule Drive Details Modal */}
      {isScheduleDriveModalOpen && selectedDrive && (
        <ModalPortal>
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0" onClick={() => setIsScheduleDriveModalOpen(false)}></div>
          <div className="bg-white rounded-[2rem] w-full max-w-xl max-h-[90vh] flex flex-col relative z-10 shadow-2xl animate-fade-in-up overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-900">Schedule Drive</h2>
              <button onClick={() => setIsScheduleDriveModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleScheduleDrive} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <div className="bg-indigo-50 text-indigo-800 p-4 rounded-sm text-sm font-medium mb-4">
                Please provide the final scheduling and location details for "{selectedDrive.title}". Submitting this will open volunteer registrations and publish the drive to the Community Feed.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Date</label>
                  <input type="date" required value={driveDate} onChange={e=>setDriveDate(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Time</label>
                  <input type="time" required value={driveTime} onChange={e=>setDriveTime(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Duration (Hrs)</label>
                  <input type="number" required min="1" value={driveDuration} onChange={e=>setDriveDuration(Number(e.target.value))} className="w-full border p-2.5 rounded-sm text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Required Volunteers</label>
                  <input type="number" required min="1" value={driveReqVol} onChange={e=>setDriveReqVol(Number(e.target.value))} className="w-full border p-2.5 rounded-sm text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Max Volunteers (Cap)</label>
                  <input type="number" required min="1" value={driveMaxVol} onChange={e=>setDriveMaxVol(Number(e.target.value))} className="w-full border p-2.5 rounded-sm text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Meeting Location / Address</label>
                  <input required value={driveMeetingLoc} onChange={e=>setDriveMeetingLoc(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm" placeholder="Exact spot to meet" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Drive Cover Image</label>
                  <input type="file" accept="image/*" onChange={handleCoverImageChange} className="w-full border p-2.5 rounded-sm text-sm bg-white" />
                  {isUploading && <p className="text-xs text-indigo-600 mt-1 font-bold">Uploading to Cloudinary...</p>}
                  {driveCoverImage && <img src={driveCoverImage} alt="Cover Preview" className="mt-2 w-full h-32 object-cover rounded-sm border border-slate-200" />}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end shrink-0 mt-4">
                <button type="button" onClick={() => setIsScheduleDriveModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-emerald-50 rounded-sm transition-colors">Cancel</button>
                <button type="submit" disabled={scheduleLoading} className="px-5 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm transition-colors">
                  {scheduleLoading ? "Scheduling..." : "Schedule and Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Edit Capacity Modal */}
      {isEditCapacityModalOpen && selectedDrive && (
        <ModalPortal>
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0" onClick={() => setIsEditCapacityModalOpen(false)}></div>
          <div className="bg-white rounded-[2rem] w-full max-w-sm max-h-[90vh] flex flex-col relative z-10 shadow-2xl animate-fade-in-up overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-900">Edit Capacity</h2>
              <button onClick={() => setIsEditCapacityModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={async (e) => {
               e.preventDefault();
               setActionLoading(true);
               try {
                  const res = await fetch(`/api/community-drives/${selectedDrive._id}`, {
                     method: "PATCH", headers: {"Content-Type":"application/json"},
                     body: JSON.stringify({ action: "update_capacity", requiredVolunteers: driveReqVol, maxVolunteers: driveMaxVol })
                  });
                  if (res.ok) { handleRefresh(); setIsEditCapacityModalOpen(false); setSelectedDrive(null); }
               } finally { setActionLoading(false); }
            }} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Required Volunteers</label>
                <input type="number" required min={selectedDrive.joinedVolunteers || 1} value={driveReqVol} onChange={e=>setDriveReqVol(Number(e.target.value))} className="w-full border p-2.5 rounded-sm text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Max Volunteers (Cap)</label>
                <input type="number" required min={driveReqVol} value={driveMaxVol} onChange={e=>setDriveMaxVol(Number(e.target.value))} className="w-full border p-2.5 rounded-sm text-sm" />
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsEditCapacityModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-emerald-50 rounded-sm transition-colors">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2.5 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-sm transition-colors">
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}
      {/* ── Edit Drive Modal ── */}
      {isEditDriveModalOpen && selectedDrive && (
        <ModalPortal>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsEditDriveModalOpen(false)}></div>
          <div className="bg-white rounded-[2rem] w-full max-w-lg flex flex-col relative z-10 shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-900">Edit Drive Details</h2>
                <p className="text-sm text-slate-500">Update information for "{selectedDrive.title}"</p>
              </div>
              <button onClick={() => setIsEditDriveModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-[#F4F9F5] hover:bg-emerald-50 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleEditDrive} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Drive Title</label>
                <input required type="text" value={driveTitle} onChange={e=>setDriveTitle(e.target.value)} className="w-full border border-emerald-100 rounded-sm px-4 py-3 text-sm focus:ring-2 focus:ring-slate-500 focus:outline-none" />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <textarea required value={driveDescription} onChange={e=>setDriveDescription(e.target.value)} rows={4} className="w-full border border-emerald-100 rounded-sm px-4 py-3 text-sm focus:ring-2 focus:ring-slate-500 focus:outline-none resize-none"></textarea>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                 <div className="col-span-1">
                   <label className="text-xs font-bold text-slate-700 block mb-1">Date</label>
                   <input required type="date" value={driveDate} onChange={e=>setDriveDate(e.target.value)} className="w-full border border-emerald-100 rounded-sm px-4 py-3 text-sm focus:ring-2 focus:ring-slate-500 focus:outline-none" />
                 </div>
                 <div className="col-span-1">
                   <label className="text-xs font-bold text-slate-700 block mb-1">Time</label>
                   <input required type="time" value={driveTime} onChange={e=>setDriveTime(e.target.value)} className="w-full border border-emerald-100 rounded-sm px-4 py-3 text-sm focus:ring-2 focus:ring-slate-500 focus:outline-none" />
                 </div>
                 <div className="col-span-1">
                   <label className="text-xs font-bold text-slate-700 block mb-1">Duration (Hrs)</label>
                   <input required type="number" min="1" step="0.5" value={driveDuration} onChange={e=>setDriveDuration(Number(e.target.value))} className="w-full border border-emerald-100 rounded-sm px-4 py-3 text-sm focus:ring-2 focus:ring-slate-500 focus:outline-none" />
                 </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Meeting Location</label>
                <input required type="text" value={driveMeetingLoc} onChange={e=>setDriveMeetingLoc(e.target.value)} className="w-full border border-emerald-100 rounded-sm px-4 py-3 text-sm focus:ring-2 focus:ring-slate-500 focus:outline-none" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Special Instructions (Optional)</label>
                <textarea value={driveInstructions} onChange={e=>setDriveInstructions(e.target.value)} rows={2} className="w-full border border-emerald-100 rounded-sm px-4 py-3 text-sm focus:ring-2 focus:ring-slate-500 focus:outline-none resize-none" placeholder="E.g. Bring gloves and wear comfortable shoes..."></textarea>
              </div>

              <div className="pt-4 flex gap-3 justify-end shrink-0 mt-4">
                <button type="button" onClick={() => setIsEditDriveModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-emerald-50 rounded-sm transition-colors">Cancel</button>
                <button type="submit" disabled={editDriveLoading} className="px-5 py-2.5 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-sm transition-colors shadow-sm disabled:opacity-50">
                  {editDriveLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Add Partner Modal */}
      {isAddPartnerModalOpen && (
        <ModalPortal>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsAddPartnerModalOpen(false)}></div>
          <div className="bg-white rounded-[2rem] w-full max-w-lg flex flex-col relative z-10 shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50 shrink-0">
              <div>
                <h2 className="text-xl font-black text-emerald-900">Add Partner Organization</h2>
                <p className="text-sm text-emerald-700">Invite organizations in your state to join this drive.</p>
              </div>
              <button onClick={() => setIsAddPartnerModalOpen(false)} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 space-y-4">
               {fetchingPartners ? (
                  <div className="text-center py-8">
                     <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                     <p className="text-sm font-bold text-slate-500">Loading organizations in {org?.state}...</p>
                  </div>
               ) : availablePartners.length === 0 ? (
                  <div className="text-center py-8 bg-[#F4F9F5] rounded-sm">
                     <p className="text-slate-500 text-sm font-bold">No verified organizations found in your state.</p>
                  </div>
               ) : (
                  <div className="space-y-3">
                     {availablePartners.map((partner, idx) => {
                        const hasRequested = selectedDrive?.partnerRequests?.some(r => r.orgId === partner._id);
                        const isAlreadyPartner = selectedDrive?.supportingOrgs?.includes(partner._id);
                        return (
                           <div key={idx} className="flex items-center justify-between p-4 bg-[#F4F9F5] rounded-sm border border-slate-100">
                              <div>
                                 <h4 className="font-bold text-slate-900">{partner.name}</h4>
                                 <p className="text-xs text-slate-500">{partner.city}, {partner.state} • {partner.type}</p>
                              </div>
                              <button 
                                 disabled={hasRequested || isAlreadyPartner || actionLoading}
                                 onClick={async() => {
                                    setActionLoading(true);
                                    try {
                                       const res = await fetch(`/api/community-drives/${selectedDrive?._id}`, {
                                          method: "PATCH", headers: {"Content-Type":"application/json"},
                                          body: JSON.stringify({ action: "request_partner", targetOrgId: partner._id, targetOrgName: partner.name, requestingOrgName: org?.name })
                                       });
                                       if (res.ok) { handleRefresh(); setIsAddPartnerModalOpen(false); setSelectedDrive(null); alert("Partnership request sent!"); }
                                       else { const e = await res.json(); alert(e.error); }
                                    } finally { setActionLoading(false); }
                                 }}
                                 className={`px-4 py-2 rounded-sm text-xs font-bold transition-colors ${
                                    isAlreadyPartner ? 'bg-slate-200 text-slate-500 cursor-not-allowed' :
                                    hasRequested ? 'bg-amber-100 text-amber-700 cursor-not-allowed' :
                                    'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                 }`}
                              >
                                 {isAlreadyPartner ? "Partnered" : hasRequested ? "Requested" : "Send Request"}
                              </button>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

    </div>
  );
}

// ── Shared Components ───────────────────────────────────────────────────
function DriveCard({ drive, showOrg = true, onClick }: { drive: Drive; showOrg?: boolean; onClick?: () => void }) {
  const statusColors: Record<string, string> = {
    OPEN: "bg-emerald-600 text-white",
    COMPLETED: "bg-slate-700 text-white",
    CANCELLED: "bg-rose-600 text-white",
    WAITING_FOR_ORG: "bg-amber-500 text-white",
    ORG_PENDING_APPROVAL: "bg-indigo-600 text-white",
    OVERDUE: "bg-rose-600 text-white"
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Cleanliness": return <Trash2 className="w-7 h-7 text-emerald-600" />;
      case "Tree Plantation": return <Leaf className="w-7 h-7 text-emerald-600" />;
      case "Plastic Collection": return <Trash2 className="w-7 h-7 text-emerald-600" />;
      case "Animal Welfare": return <Heart className="w-7 h-7 text-emerald-600" />;
      case "Awareness Campaign": return <Globe className="w-7 h-7 text-emerald-600" />;
      case "Wall Painting": return <Edit3 className="w-7 h-7 text-emerald-600" />;
      case "Park Cleaning": return <MapPin className="w-7 h-7 text-emerald-600" />;
      case "Lake Cleaning": return <Activity className="w-7 h-7 text-emerald-600" />;
      case "River Cleaning": return <Activity className="w-7 h-7 text-emerald-600" />;
      case "Public Health": return <Shield className="w-7 h-7 text-emerald-600" />;
      case "Waste Segregation": return <Trash2 className="w-7 h-7 text-emerald-600" />;
      default: return <Target className="w-7 h-7 text-emerald-600" />;
    }
  };

  const actualJoined = drive.volunteers ? drive.volunteers.filter((v: any) => v.status !== 'rejected').length : drive.joinedVolunteers;

  return (
    <div onClick={onClick} className="bg-white rounded-[2rem] border border-slate-200/60 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full group p-2">
      <div className="bg-gradient-to-br from-emerald-50/50 to-white rounded-[1.5rem] p-6 flex-1 flex flex-col relative h-full">
         <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-white shadow-sm rounded-2xl border border-emerald-100 flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
               {getCategoryIcon(drive.category)}
            </div>
            <span className={`${statusColors[drive.status] || "bg-emerald-100 text-emerald-800"} text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm`}>
               {drive.status.replace(/_/g, " ")}
            </span>
         </div>
         
         <div className="mb-4">
            <h3 className="font-black text-slate-800 text-xl leading-tight mb-2 line-clamp-1 group-hover:text-emerald-700 transition-colors">{drive.title}</h3>
            {showOrg && drive.orgName && <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Liaison: <span className="text-emerald-600">{drive.orgName}</span></p>}
         </div>

         <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-1 leading-relaxed font-medium">{drive.description}</p>

         <div className="bg-white border border-slate-100 rounded-2xl p-4 grid grid-cols-2 gap-y-4 gap-x-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider shadow-sm group-hover:border-emerald-100 transition-colors">
            <div className="flex items-center gap-2.5">
               <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
               <span className="truncate text-slate-600">{drive.city}</span>
            </div>
            <div className="flex items-center gap-2.5">
               <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
               <span className="truncate text-slate-600">{new Date(drive.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-2.5">
               <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
               <span className="text-slate-600">{drive.time}</span>
            </div>
            <div className="flex items-center gap-2.5">
               <Users className="w-4 h-4 text-emerald-500 shrink-0" />
               <span className="text-slate-600">{actualJoined}/{drive.maxVolunteers || drive.requiredVolunteers} Vols</span>
            </div>
         </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, message, badge }: {
  icon: React.ReactNode; title: string; message: string; badge?: string;
}) {
  return (
    <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm animate-fade-in">
      <div className="text-slate-200 flex justify-center mb-4">{icon}</div>
      <h3 className="font-bold text-slate-700 mb-2">{title}</h3>
      <p className="text-slate-400 text-sm max-w-xs mx-auto">{message}</p>
      {badge && <span className="inline-block mt-4 bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full">{badge}</span>}
    </div>
  );
}
