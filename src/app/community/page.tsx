"use client";

import {
  Heart, MessageCircle, Share2, Award, ShieldCheck, BadgeCheck,
  CheckCircle, Search, ThumbsUp, HeartHandshake, Users, MapPin,
  AlertTriangle, CheckCircle2, Clock, Send, X, BarChart2, TrendingUp, Building2, Eye,
  ChevronLeft, ChevronRight, MoreHorizontal, Bookmark, User, Calendar
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// -- INTERFACES --
interface Post {
  _id: string;
  issueId: string;
  title: string;
  postType: string;
  beforeImageUrls?: string[];
  afterImageUrls?: string[];
  videoUrls?: string[];
  location: { address: string; city?: string; state?: string };
  department: string;
  reportedByName?: string;
  resolvedByName?: string;
  resolutionSummary: string;
  reportedAt?: string;
  resolvedAt: string;
  resolutionTimeHours?: number;
  verificationStatus: string;
  upvotes: number;
  likes: { userId: string }[];
  bookmarks?: { userId: string }[];
  comments: { _id: string; userId: string; userName: string; text: string; createdAt: string; reportedBy?: string[] }[];
  views: number;
  impactMetrics?: { volunteerHours: number; volunteerCount: number; wasteCollected?: number; treesPlanted?: number };
  correctionRequest?: { status: string; details: string };
}

interface Stats {
  totalResolved: number;
  totalIssues: number;
  avgResolutionHours: number;
  topDepartment: string;
  totalDrives: number;
  verifiedOrgs: number;
  totalVolunteerHours: number;
  activeVolunteers: number;
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
  requiredVolunteers: number;
  maxVolunteers?: number;
  joinedVolunteers: number;
  status: string;
  orgName?: string;
}

interface Organization {
  _id: string;
  name: string;
  type: string;
  city: string;
  state: string;
  activeMembers: number;
  completedDrivesCount: number;
  trustScore: number;
  logoUrl?: string;
  mission?: string;
}

// -- MAIN COMPONENT --
export default function CommunityHubPage() {
  const { user, appUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [stats, setStats] = useState<Stats>({ 
    totalResolved: 0, totalIssues: 0, avgResolutionHours: 0, topDepartment: "—",
    totalDrives: 0, verifiedOrgs: 0, totalVolunteerHours: 0, activeVolunteers: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterPostType, setFilterPostType] = useState("All");
  const [sortType, setSortType] = useState("Latest");
  const [activeTab, setActiveTab] = useState<"drives" | "orgs" | "posts">("drives");
  
  // Comments Modal State
  const [activePostForComments, setActivePostForComments] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const userId = user?.email || appUser?.email || "anonymous";
  const userName = user?.displayName || appUser?.name || "Community Member";

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filterPostType !== "All") queryParams.set("postType", filterPostType);
      if (sortType !== "Latest") queryParams.set("sort", sortType);
      
      const [postsRes, statsRes, drivesRes, orgsRes] = await Promise.all([
        fetch(`/api/community?${queryParams.toString()}`),
        fetch("/api/community?statsOnly=true"),
        fetch("/api/community-drives?status=VOLUNTEER_REG_OPEN"),
        fetch("/api/volunteer-org?status=VERIFIED")
      ]);
      const postsData = await postsRes.json();
      const statsData = await statsRes.json();
      const drivesData = await drivesRes.json();
      const orgsData = await orgsRes.json();
      
      if (Array.isArray(postsData)) setPosts(postsData);
      if (statsData && !statsData.error) setStats(statsData);
      if (Array.isArray(drivesData)) setDrives(drivesData);
      if (Array.isArray(orgsData)) setOrgs(orgsData);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData, filterPostType, sortType]);

  // -- SCROLL TO BOTTOM --
  useEffect(() => {
    if (activePostForComments && commentsEndRef.current) {
       commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activePostForComments?.comments]);

  // -- HANDLERS --
  const handleLike = async (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p._id !== postId) return p;
      const hasLiked = p.likes.some(l => l.userId === userId);
      return {
        ...p,
        likes: hasLiked ? p.likes.filter(l => l.userId !== userId) : [...p.likes, { userId }],
        upvotes: hasLiked ? p.upvotes - 1 : p.upvotes + 1
      };
    }));

    if (activePostForComments?._id === postId) {
      setActivePostForComments(prev => {
        if (!prev) return prev;
        const hasLiked = prev.likes.some(l => l.userId === userId);
        return {
           ...prev,
           likes: hasLiked ? prev.likes.filter(l => l.userId !== userId) : [...prev.likes, { userId }]
        }
      });
    }

    try {
      await fetch(`/api/community/${postId}/like`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
    } catch { loadData(); }
  };

  const handleComment = async () => {
    if (!activePostForComments || !commentText.trim()) return;
    setIsSubmitting(true);
    const postId = activePostForComments._id;
    try {
      await fetch(`/api/community/${postId}/comment`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userName, text: commentText })
      });
      setCommentText("");
      await loadData();
      
      const res = await fetch("/api/community");
      const updatedPosts = await res.json();
      const updatedActive = updatedPosts.find((p: Post) => p._id === postId);
      if (updatedActive) setActivePostForComments(updatedActive);
      
    } catch { alert("Failed to post comment"); }
    finally { setIsSubmitting(false); }
  };

  const handleShare = async (post: Post) => {
    const shareData = {
      title: 'Community Hero - ' + post.title,
      text: post.resolutionSummary,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (err) {}
  };

  const handleBookmark = async (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p._id !== postId) return p;
      const hasBookmarked = p.bookmarks?.some(b => b.userId === userId);
      const newBookmarks = hasBookmarked 
          ? p.bookmarks!.filter(b => b.userId !== userId)
          : [...(p.bookmarks || []), { userId }];
      return { ...p, bookmarks: newBookmarks };
    }));
    try {
      await fetch("/api/community", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bookmark", postId, userId })
      });
    } catch {}
  };

  const handleReportComment = async (postId: string, commentId: string) => {
    if (!confirm("Are you sure you want to report this comment?")) return;
    try {
      await fetch("/api/community", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "report_comment", postId, commentId, reportedBy: userId })
      });
      alert("Comment reported for admin review.");
    } catch {}
  };

  const handleRequestCorrection = async (postId: string) => {
    const details = prompt("Please describe what needs to be corrected in this story:");
    if (!details) return;
    try {
      await fetch("/api/community", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_correction", postId, details })
      });
      alert("Correction request submitted for admin review.");
      loadData();
    } catch {}
  };

  const formatResolutionTime = (hours?: number) => {
    if (!hours) return "—";
    if (hours < 24) return `${hours}h`;
    return `${Math.round(hours / 24)}d ${hours % 24}h`;
  };

  const departments = ["All", ...Array.from(new Set(posts.map(p => p.department).filter(Boolean)))];

  const filteredPosts = posts.filter(p => {
    const matchesDept = filterDept === "All" || p.department === filterDept;
    const matchesSearch = !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.resolutionSummary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });
  
  const filteredDrives = drives.filter(d => 
    !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredOrgs = orgs.filter(o => 
    !searchQuery || o.name.toLowerCase().includes(searchQuery.toLowerCase()) || o.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-sm" />
        <p className="text-slate-500 font-bold uppercase tracking-wider text-sm">Loading community impact…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-[120px]">
      
      {/* ─── PREMIUM HERO & STATS ─── */}
      <section className="relative bg-white border-b border-slate-200 overflow-hidden pt-16 pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-emerald-800 to-green-900">
           {/* Abstract patterns */}
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        </div>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          
          <div className="flex-1 max-w-2xl text-center md:text-left text-white">
            <span className="inline-block py-1.5 px-3 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-green-50 mb-6 border border-white/10">Community Hub</span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight mb-6 leading-tight">
              Unite for a <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-200">Better City</span>
            </h1>
            <p className="text-lg text-green-50 font-medium max-w-xl mx-auto md:mx-0 mb-10 opacity-90">
              Discover verified organizations, join upcoming community drives, and explore the positive impact citizens and municipal workers are making every day.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
               <button onClick={() => setActiveTab("orgs")} className="px-6 py-3.5 rounded-xl bg-white text-green-900 font-black tracking-wide shadow-xl shadow-green-900/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                 Explore Orgs <ChevronRight className="w-4 h-4"/>
               </button>
               <button onClick={() => setActiveTab("drives")} className="px-6 py-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold tracking-wide hover:bg-white/20 active:scale-95 transition-all flex items-center gap-2">
                 Upcoming Drives <Calendar className="w-4 h-4"/>
               </button>
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg">
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
                   <Users className="w-8 h-8 text-green-300 mb-4" />
                   <h3 className="text-3xl font-black text-white">{stats.activeVolunteers.toLocaleString()}</h3>
                   <p className="text-green-100/70 font-medium text-sm mt-1 uppercase tracking-wider">Active Volunteers</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
                   <Clock className="w-8 h-8 text-emerald-300 mb-4" />
                   <h3 className="text-3xl font-black text-white">{stats.totalVolunteerHours.toLocaleString()}</h3>
                   <p className="text-green-100/70 font-medium text-sm mt-1 uppercase tracking-wider">Volunteer Hours</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
                   <Building2 className="w-8 h-8 text-green-300 mb-4" />
                   <h3 className="text-3xl font-black text-white">{stats.verifiedOrgs.toLocaleString()}</h3>
                   <p className="text-green-100/70 font-medium text-sm mt-1 uppercase tracking-wider">Verified Orgs</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
                   <CheckCircle2 className="w-8 h-8 text-emerald-300 mb-4" />
                   <h3 className="text-3xl font-black text-white">{stats.totalDrives.toLocaleString()}</h3>
                   <p className="text-green-100/70 font-medium text-sm mt-1 uppercase tracking-wider">Total Drives</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ─── ABOUT / TRUST SECTION ─── */}
      <section className="bg-slate-900 py-16">
         <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1">
               <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Why Volunteer With Us?</h2>
               <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-xl mb-8">
                  Community Hero bridges the gap between citizens, verified organizations, and local government. By joining verified drives, you ensure your effort directly contributes to resolving real civic issues.
               </p>
               <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-slate-300 font-medium"><ShieldCheck className="text-green-500 w-6 h-6 shrink-0"/> All organizations are strictly vetted and verified by admins.</li>
                  <li className="flex items-center gap-3 text-slate-300 font-medium"><BadgeCheck className="text-blue-500 w-6 h-6 shrink-0"/> Earn verified community service certificates and badges.</li>
                  <li className="flex items-center gap-3 text-slate-300 font-medium"><HeartHandshake className="text-emerald-500 w-6 h-6 shrink-0"/> Direct impact on your neighborhood's cleanliness and safety.</li>
               </ul>
            </div>
            <div className="flex-1 w-full max-w-md bg-white rounded-3xl p-8 text-center">
               <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><Award className="w-10 h-10 text-green-600"/></div>
               <h3 className="text-2xl font-black text-slate-900 mb-2">Build Your Rank</h3>
               <p className="text-slate-600 mb-6">Complete drives to level up your Community Hero rank and unlock special recognition.</p>
               <a href="/my-volunteering" className="block w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">View My Dashboard</a>
            </div>
         </div>
      </section>

      {/* ─── TABS & FILTERS ─── */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm w-full md:w-auto">
            <button onClick={() => setActiveTab("drives")} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "drives" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>Upcoming Drives</button>
            <button onClick={() => setActiveTab("orgs")} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "orgs" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>Organizations</button>
            <button onClick={() => setActiveTab("posts")} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "posts" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>Recent Activity</button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            {activeTab === "posts" && (
              <>
                <select value={filterPostType} onChange={e => setFilterPostType(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none">
                  <option value="All">All Story Types</option>
                  <option value="Issue_Based">Citizen Reported</option>
                  <option value="Self_Initiated">Volunteer Driven</option>
                  <option value="Municipal_Success">Municipal Success</option>
                </select>
                <select value={sortType} onChange={e => setSortType(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none">
                  <option value="Latest">Latest</option>
                  <option value="Most Liked">Most Liked</option>
                  <option value="Most Impactful">Most Impactful</option>
                </select>
              </>
            )}
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-sm font-medium focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none shadow-sm placeholder:text-slate-400" />
            </div>
          </div>
        </div>

        {/* ─── DRIVES TAB ─── */}
        {activeTab === "drives" && (
          <div className="space-y-6">
             {filteredDrives.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">No Drives Open</h3>
                  <p className="text-slate-500 font-medium text-sm">Check back later for new community drives to join.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {filteredDrives.map(drive => {
                      const isFull = drive.maxVolunteers ? drive.joinedVolunteers >= drive.maxVolunteers : false;
                      return (
                         <div key={drive._id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                            {isFull && <div className="absolute top-4 right-4 bg-red-100 text-red-700 text-[10px] font-black px-3 py-1 rounded-full tracking-wider uppercase">Registration Full</div>}
                            <div className="flex items-center gap-3 mb-4">
                               <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-2xl shrink-0">🌱</div>
                               <div>
                                  <h3 className="font-bold text-slate-900 leading-tight">{drive.title}</h3>
                                  <p className="text-xs font-semibold text-green-600 mt-1">by {drive.orgName}</p>
                               </div>
                            </div>
                            <p className="text-sm text-slate-600 mb-6 line-clamp-3 flex-1">{drive.description}</p>
                            
                            <div className="grid grid-cols-2 gap-y-3 mb-6">
                               <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-slate-400" />
                                  <span className="text-xs font-bold text-slate-700 truncate">{drive.city}, {drive.state}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-slate-400" />
                                  <span className="text-xs font-bold text-slate-700">{new Date(drive.date).toLocaleDateString()}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-slate-400" />
                                  <span className="text-xs font-bold text-slate-700">{drive.time}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-slate-400" />
                                  <span className="text-xs font-bold text-slate-700">{drive.joinedVolunteers}/{drive.maxVolunteers || drive.requiredVolunteers} joined</span>
                               </div>
                            </div>

                            <a
                               href={`/community/drive/${drive._id}`}
                               className="block text-center w-full py-3.5 rounded-2xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 shadow-lg active:scale-95 transition-all"
                            >
                               View Details
                            </a>
                         </div>
                      );
                   })}
                </div>
             )}
          </div>
        )}

        {/* ─── ORGANIZATIONS TAB ─── */}
        {activeTab === "orgs" && (
          <div className="space-y-6">
             {filteredOrgs.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building2 className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">No Organizations Found</h3>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {filteredOrgs.map(org => (
                      <div key={org._id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                         <div className="flex items-center justify-between mb-4">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100 overflow-hidden">
                               {org.logoUrl ? <img src={org.logoUrl} className="w-full h-full object-cover"/> : <Building2 className="w-6 h-6 text-emerald-600" />}
                            </div>
                            <div className="flex flex-col items-end">
                               <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-full uppercase"><ShieldCheck className="w-3 h-3"/> Verified</span>
                               <span className="text-xs font-bold text-slate-500 mt-1">Score: {org.trustScore}/100</span>
                            </div>
                         </div>
                         <h3 className="font-black text-xl text-slate-900 mb-1">{org.name}</h3>
                         <p className="text-xs font-bold text-blue-600 mb-4">{org.type} • {org.city}, {org.state}</p>
                         <p className="text-sm text-slate-600 mb-6 line-clamp-3 flex-1">{org.mission || "Dedicated to improving our community through active civic participation and volunteering."}</p>
                         
                         <div className="flex items-center justify-between border-t border-slate-100 pt-4 mb-4">
                            <div className="text-center">
                               <p className="text-lg font-black text-slate-900">{org.completedDrivesCount || 0}</p>
                               <p className="text-[10px] font-bold text-slate-500 uppercase">Drives</p>
                            </div>
                            <div className="w-px h-8 bg-slate-200"></div>
                            <div className="text-center">
                               <p className="text-lg font-black text-slate-900">{org.activeMembers || 0}</p>
                               <p className="text-[10px] font-bold text-slate-500 uppercase">Members</p>
                            </div>
                         </div>
                         
                         <a href={`/community/org/${org._id}`} className="block text-center w-full py-3.5 rounded-2xl font-bold text-sm bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-95 transition-all">
                            View Profile
                         </a>
                      </div>
                   ))}
                </div>
             )}
          </div>
        )}

        {/* ─── POSTS (RECENT ACTIVITY) TAB ─── */}
        {activeTab === "posts" && (
          <div className="max-w-3xl mx-auto space-y-10">
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6"><Users className="w-10 h-10 text-slate-300" /></div>
                <h3 className="text-xl font-black text-slate-900 mb-2">No resolved issues found</h3>
              </div>
            ) : (
              filteredPosts.map(post => {
                const hasLiked = post.likes.some(l => l.userId === userId);
                return (
                  <article key={post._id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200 flex items-center justify-center shrink-0">
                           <Building2 className="w-5 h-5 text-green-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-slate-900 text-sm">{post.department}</p>
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                          </div>
                          <p className="text-xs text-slate-500">{post.location.city || "Local"} • {post.resolvedByName || "Team"}</p>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-5 h-5" /></button>
                    </div>

                    <div className="aspect-[4/3] bg-slate-900 relative group cursor-pointer" onClick={() => window.location.href=`/community/post/${post._id}`}>
                      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                         {post.postType === "Municipal_Success" ? (
                             <span className="inline-flex items-center gap-1.5 bg-blue-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
                                <ShieldCheck className="w-3.5 h-3.5" /> Municipal Success
                             </span>
                         ) : post.postType === "Self_Initiated" ? (
                             <span className="inline-flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
                                <HeartHandshake className="w-3.5 h-3.5" /> Volunteer Driven
                             </span>
                         ) : (
                             <span className="inline-flex items-center gap-1.5 bg-green-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Citizen Reported
                             </span>
                         )}
                      </div>
                      
                      {/* Interactive hover overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center">
                         <span className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2">
                           <Eye className="w-4 h-4" /> View Full Story
                         </span>
                      </div>

                      {post.postType !== "Self_Initiated" ? (
                        <div className="w-full h-full flex">
                           <div className="w-1/2 h-full relative border-r border-slate-800/50">
                              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[9px] font-black px-2 py-1 rounded">BEFORE</div>
                              {post.beforeImageUrls?.[0] ? <img src={post.beforeImageUrls[0]} alt="Before" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-slate-600" /></div>}
                           </div>
                           <div className="w-1/2 h-full relative">
                              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[9px] font-black px-2 py-1 rounded">AFTER</div>
                              {post.afterImageUrls?.[0] ? <img src={post.afterImageUrls[0]} alt="After" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><CheckCircle className="w-8 h-8 text-slate-600" /></div>}
                           </div>
                        </div>
                      ) : (
                        <div className="w-full h-full relative">
                           {post.afterImageUrls?.[0] ? <img src={post.afterImageUrls[0]} alt="Impact" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><CheckCircle className="w-8 h-8 text-slate-600" /></div>}
                        </div>
                      )}
                    </div>

                    <div className="p-4 pb-2 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button onClick={() => handleLike(post._id)} className="transition-transform active:scale-90 hover:opacity-70"><Heart className={`w-7 h-7 ${hasLiked ? "fill-red-500 text-red-500" : "text-slate-800"}`} /></button>
                        <button onClick={() => setActivePostForComments(post)} className="transition-transform active:scale-90 hover:opacity-70"><MessageCircle className="w-7 h-7 text-slate-800" /></button>
                        <button onClick={() => handleShare(post)} className="transition-transform active:scale-90 hover:opacity-70"><Share2 className="w-6 h-6 text-slate-800" /></button>
                      </div>
                      <div>
                        <button onClick={() => handleBookmark(post._id)} className="transition-transform active:scale-90 hover:opacity-70">
                          <Bookmark className={`w-7 h-7 ${post.bookmarks?.some(b => b.userId === userId) ? "fill-slate-800 text-slate-800" : "text-slate-800"}`} />
                        </button>
                      </div>
                    </div>

                    <div className="px-4 pb-4 space-y-2">
                      <p className="font-bold text-slate-900 text-sm">{post.likes.length.toLocaleString()} likes</p>
                      <div>
                        <span className="font-bold text-slate-900 text-sm mr-2">{post.reportedByName || "Citizen"}</span>
                        <span className="text-sm text-slate-800">{post.title} — {post.resolutionSummary}</span>
                      </div>
                      {post.comments.length > 0 && <button onClick={() => setActivePostForComments(post)} className="text-sm text-slate-500 font-medium hover:text-slate-700">View all {post.comments.length} comments</button>}
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide pt-1">{new Date(post.resolvedAt).toLocaleDateString()} • {formatResolutionTime(post.resolutionTimeHours)}</p>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* ─── INSTAGRAM-STYLE COMMENTS MODAL ─── */}
      {activePostForComments && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-12">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActivePostForComments(null)}></div>
          <div className="relative w-full h-full md:h-auto md:max-h-full max-w-5xl bg-white md:rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="hidden md:flex flex-1 bg-slate-900 items-center justify-center relative">
               <div className="w-full h-full flex">
                  <div className="w-1/2 h-full relative border-r border-slate-800">{activePostForComments.beforeImageUrls?.[0] && <img src={activePostForComments.beforeImageUrls[0]} alt="Before" className="w-full h-full object-cover" />}</div>
                  <div className="w-1/2 h-full relative">{activePostForComments.afterImageUrls?.[0] && <img src={activePostForComments.afterImageUrls[0]} alt="After" className="w-full h-full object-cover" />}</div>
               </div>
            </div>
            <div className="flex flex-col w-full md:w-[400px] lg:w-[450px] h-full md:max-h-[85vh] bg-white">
              <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><Building2 className="w-4 h-4 text-green-700" /></div>
                   <p className="font-bold text-slate-900 text-sm">{activePostForComments.department}</p>
                 </div>
                 <button onClick={() => setActivePostForComments(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-900" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 <div className="flex gap-3 mb-6 pb-4 border-b border-slate-100">
                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-slate-500" /></div>
                   <div>
                     <p className="text-sm"><span className="font-bold text-slate-900 mr-2">{activePostForComments.reportedByName || "Citizen"}</span>{activePostForComments.title} — {activePostForComments.resolutionSummary}</p>
                     <p className="text-xs text-slate-400 mt-1">{new Date(activePostForComments.resolvedAt).toLocaleDateString()}</p>
                   </div>
                 </div>
                 {activePostForComments.comments.map(c => (
                   <div key={c._id} className="flex gap-3">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200 flex items-center justify-center font-bold text-green-700 text-xs shrink-0">{c.userName.charAt(0).toUpperCase()}</div>
                     <div className="flex-1">
                       <p className="text-sm"><span className="font-bold text-slate-900 mr-2">{c.userName}</span>{c.text}</p>
                       <div className="flex items-center gap-4 mt-1">
                         <p className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</p>
                         <button onClick={() => handleReportComment(activePostForComments._id, c._id)} className="text-[10px] font-bold text-slate-400 hover:text-red-600 transition-colors">Report</button>
                       </div>
                     </div>
                     <button className="self-center p-2"><Heart className="w-3 h-3 text-slate-300 hover:text-red-500" /></button>
                   </div>
                 ))}
                 <div ref={commentsEndRef} />
              </div>
              <div className="p-4 border-t border-slate-200 shrink-0">
                <div className="flex items-center gap-4 mb-3">
                  <button onClick={() => handleLike(activePostForComments._id)} className="transition-transform active:scale-90 hover:opacity-70"><Heart className={`w-6 h-6 ${activePostForComments.likes.some(l => l.userId === userId) ? "fill-red-500 text-red-500" : "text-slate-800"}`} /></button>
                  <button className="transition-transform active:scale-90 hover:opacity-70"><MessageCircle className="w-6 h-6 text-slate-800" /></button>
                  <button onClick={() => handleShare(activePostForComments)} className="transition-transform active:scale-90 hover:opacity-70"><Share2 className="w-6 h-6 text-slate-800" /></button>
                </div>
                <p className="font-bold text-slate-900 text-sm mb-1">{activePostForComments.likes.length.toLocaleString()} likes</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">{new Date(activePostForComments.resolvedAt).toLocaleDateString()}</p>
              </div>
              <div className="h-16 border-t border-slate-200 flex items-center px-4 shrink-0 bg-slate-50">
                 <input type="text" placeholder="Add a comment..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm" value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleComment(); }} />
                 <button onClick={handleComment} disabled={!commentText.trim() || isSubmitting} className="text-green-600 font-bold text-sm px-2 disabled:opacity-50 transition-opacity">Post</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
