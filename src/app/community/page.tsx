"use client";

import {
  Heart, MessageCircle, Share2, Award, ShieldCheck, BadgeCheck,
  CheckCircle, Search, ThumbsUp, HeartHandshake, Users, MapPin,
  AlertTriangle, CheckCircle2, Clock, Send, X, BarChart2, TrendingUp, Building2, Eye, Leaf,
  ChevronLeft, ChevronRight, MoreHorizontal, Bookmark, User, Calendar
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";

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

  // Drive Registration Modal State
  const router = useRouter();
  const [selectedDriveForRegistration, setSelectedDriveForRegistration] = useState<Drive | null>(null);
  const [joinName, setJoinName] = useState(user?.displayName || appUser?.name || "");
  const [joinPhone, setJoinPhone] = useState("");
  const [joinEmail, setJoinEmail] = useState(user?.email || appUser?.email || "");
  const [joinAge, setJoinAge] = useState("");
  const [reasonForJoining, setReasonForJoining] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [agreeGuidelines, setAgreeGuidelines] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Join Org State
  const [selectedOrgForRegistration, setSelectedOrgForRegistration] = useState<Organization | null>(null);
  const [joinOrgCity, setJoinOrgCity] = useState("");

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgForRegistration) return;
    if (!agreeGuidelines) return alert("You must agree to the guidelines.");
    
    setIsJoining(true);
    try {
      const res = await fetch(`/api/volunteer-org/${selectedOrgForRegistration._id}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            action: "join_org",
            name: joinName,
            email: joinEmail,
            age: parseInt(joinAge),
            skills: joinOrgCity, // Using skills field to store city temporarily
            motivation: reasonForJoining,
            userId: userId !== "anonymous" ? userId : undefined,
            phone: joinPhone || "0000000000" // Mock phone if not provided
         })
      });
      if (res.ok) {
         alert("Request submitted successfully to the organization!");
         setSelectedOrgForRegistration(null);
         router.push("/profile");
      } else {
         const err = await res.json();
         alert(err.error || "Failed to join.");
      }
    } catch {
       alert("Error submitting request.");
    } finally {
       setIsJoining(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriveForRegistration) return;
    if (!agreeGuidelines) return alert("You must agree to the guidelines.");
    
    setIsJoining(true);
    try {
      const res = await fetch(`/api/community-drives/${selectedDriveForRegistration._id}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            action: "volunteer_join",
            name: joinName,
            email: joinEmail,
            phone: joinPhone,
            age: parseInt(joinAge),
            reasonForJoining,
            emergencyContact,
            userId: userId !== "anonymous" ? userId : undefined
         })
      });
      if (res.ok) {
         alert("Request submitted successfully!");
         setSelectedDriveForRegistration(null);
         router.push("/profile");
      } else {
         const err = await res.json();
         alert(err.error || "Failed to join.");
      }
    } catch {
       alert("Error submitting request.");
    } finally {
       setIsJoining(false);
    }
  };



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
    <div className="min-h-screen bg-white font-sans pb-0">
      
      {/* ─── BANNER SECTION ─── */}
      <section className="bg-[#f8faf6] w-full px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center text-center relative overflow-hidden">
        <div className="z-10 w-full max-w-4xl flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
            Stronger Communities,<br/>
            <span className="text-green-700">Better Tomorrow 💚</span>
          </h1>
          <p className="text-slate-700 font-medium mb-10 text-lg">
            See the impact we're creating together.<br/>
            Stay informed, get inspired and be a part of the change.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
             <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm min-w-[180px] text-left">
               <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                 <Leaf className="w-6 h-6 text-green-700" />
               </div>
               <div>
                 <p className="font-black text-2xl text-slate-900">{stats.totalResolved || posts.filter(p => p.resolutionSummary).length}</p>
                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Issues Resolved</p>
               </div>
             </div>
             <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm min-w-[180px] text-left">
               <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                 <Users className="w-6 h-6 text-slate-700" />
               </div>
               <div>
                 <p className="font-black text-2xl text-slate-900">{stats.verifiedOrgs || orgs.length}</p>
                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Organizations</p>
               </div>
             </div>
             <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm min-w-[180px] text-left">
               <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                 <CheckCircle2 className="w-6 h-6 text-green-700" />
               </div>
               <div>
                 <p className="font-black text-2xl text-slate-900">{stats.totalDrives || drives.length}</p>
                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Active Drives</p>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* ─── RESOLVED ISSUES SECTION ─── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Resolved Issues</h2>
            <p className="text-sm font-medium text-slate-500">See real issues reported by citizens and resolved by our heroes.</p>
          </div>
          <button className="px-5 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors shadow-sm bg-white">View All</button>
        </div>
        
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          <button className="px-5 py-2.5 font-bold rounded-xl text-sm whitespace-nowrap transition-all bg-green-700 text-white shadow-md">All Posts</button>
          <button className="px-5 py-2.5 font-bold rounded-xl text-sm whitespace-nowrap transition-all bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">Recently Resolved</button>
          <button className="px-5 py-2.5 font-bold rounded-xl text-sm whitespace-nowrap transition-all bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">Most Liked</button>
          <button className="px-5 py-2.5 font-bold rounded-xl text-sm whitespace-nowrap transition-all bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">Following</button>
        </div>

        <div className="h-[600px] overflow-y-auto pr-2 flex flex-col items-center space-y-6 custom-scrollbar">
          {posts.slice(0, 4).length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-2">No resolved issues found</h3>
            </div>
          ) : (
            posts.slice(0, 4).map(post => {
              const hasLiked = post.likes.some(l => l.userId === userId);
              return (
                <article key={post._id} className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative max-w-3xl cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href=`/community/post/${post._id}`}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100">
                         <img src={"https://api.dicebear.com/7.x/avataaars/svg?seed=" + (post.reportedByName || "User")} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <p className="font-bold text-slate-900 text-sm">{post.title}</p>
                           <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">Resolved</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Reported by {post.reportedByName || "Citizen"} • {new Date(post.reportedAt || post.resolvedAt).toLocaleDateString("en-GB", {day:"numeric", month:"short", year:"numeric"})}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <div className="flex items-center gap-1" onClick={(e) => { e.stopPropagation(); handleLike(post._id); }}><Heart className={`w-4 h-4 ${hasLiked ? 'fill-red-500 text-red-500' : ''}`} /><span className="text-xs font-bold text-slate-700">{post.likes.length || 128}</span></div>
                      <button className="hover:text-slate-600" onClick={(e) => { e.stopPropagation(); setActivePostForComments(post); }}><MessageCircle className="w-4 h-4" /></button>
                      <button className="hover:text-slate-600" onClick={(e) => { e.stopPropagation(); handleShare(post); }}><Share2 className="w-4 h-4" /></button>
                      <button className="hover:text-slate-600"><MoreHorizontal className="w-5 h-5" /></button>
                    </div>
                  </div>

                  {/* Images */}
                  <div className="flex gap-1 h-[250px] mb-4 relative rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                    <div className="w-1/2 h-full relative group p-2">
                      <div className="absolute top-4 left-4 bg-slate-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10">Before</div>
                      {post.beforeImageUrls?.[0] ? <img src={post.beforeImageUrls[0]} alt="Before" className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105" /> : <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-slate-300" /></div>}
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md z-20">
                       <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="w-1/2 h-full relative group p-2">
                      <div className="absolute top-4 left-4 bg-slate-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10">After</div>
                      {post.afterImageUrls?.[0] ? <img src={post.afterImageUrls[0]} alt="After" className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105" /> : <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center"><CheckCircle className="w-8 h-8 text-slate-300" /></div>}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-end justify-between">
                     <div>
                       <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mb-1"><MapPin className="w-4 h-4 text-slate-400" /> {post.location.address || post.location.city || "Unknown Location"}</p>
                       <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-500" /> Resolved by {post.resolvedByName || post.department || "Municipal Corporation"} <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /></p>
                     </div>
                     <p className="text-xs font-bold text-slate-400">{new Date(post.resolvedAt).toLocaleDateString("en-GB", {day:"numeric", month:"short", year:"numeric"})}</p>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* ─── LIVE DRIVES SECTION ─── */}
      <section className="bg-slate-50 border-y border-slate-200 mt-20 py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">Live Drives</h2>
              <p className="text-sm font-medium text-slate-500">Join ongoing community drives and make a real impact.</p>
            </div>
            <button className="text-green-700 font-bold text-sm flex items-center gap-1 hover:underline">View All Drives <ChevronRight className="w-4 h-4"/></button>
          </div>

          <div className="flex overflow-x-auto gap-6 pb-4 snap-x custom-scrollbar">
            {drives.map(drive => {
               const actualJoined = (drive as any).volunteers ? (drive as any).volunteers.filter((v: any) => v.status !== 'rejected').length : drive.joinedVolunteers;
               const maxVols = drive.maxVolunteers || drive.requiredVolunteers || 100;
               const progressPercent = Math.min(100, Math.round((actualJoined / maxVols) * 100));
               const isRegistered = (drive as any).volunteers?.some((v: any) => v.email === (user?.email || appUser?.email) || (userId !== "anonymous" && v.userId === userId));
               const isFull = maxVols ? actualJoined >= maxVols : false;
               return (
                <div key={drive._id} className="min-w-[320px] w-[320px] bg-white border border-slate-200 rounded-2xl shrink-0 snap-start shadow-sm overflow-hidden flex flex-col">
                  {/* Image Header */}
                  <div className="h-[160px] w-full relative bg-slate-100">
                    <div className="absolute top-3 left-3 bg-green-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-sm z-10">Live</div>
                    <img src={"https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=600"} alt="Drive" className="w-full h-full object-cover" />
                  </div>
                  
                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-black text-slate-900 text-lg leading-tight mb-2 line-clamp-1">{drive.title}</h3>
                    <p className="text-xs text-slate-600 mb-4 line-clamp-2">{drive.description}</p>
                    
                    <div className="space-y-2 mb-5">
                      <p className="text-[11px] font-bold text-slate-600 flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {drive.city}, {drive.state}</p>
                      <p className="text-[11px] font-bold text-slate-600 flex items-center gap-2"><Users className="w-3.5 h-3.5 text-slate-400" /> {actualJoined} Volunteers</p>
                    </div>

                    <div className="mt-auto">
                      <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                        <span className="text-slate-900 text-base">{progressPercent}%</span>
                        <span className="text-slate-500">Goal: {maxVols} Volunteers</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4">
                        <div className="bg-green-600 h-1.5 rounded-full" style={{width: `${progressPercent}%`}}></div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                            if (isRegistered) { e.preventDefault(); return; }
                            setJoinName(user?.displayName || appUser?.name || "");
                            setJoinEmail(user?.email || appUser?.email || "");
                            setSelectedDriveForRegistration(drive);
                        }}
                        className={`w-full border border-green-600 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${isRegistered ? "bg-emerald-100 text-emerald-800 cursor-not-allowed" : "text-green-700 hover:bg-green-50"}`}
                      >
                        <User className="w-4 h-4"/> {isRegistered ? "Registered" : isFull ? "View Details" : "Join Drive"}
                      </button>
                    </div>
                  </div>
                </div>
               );
            })}
          </div>
        </div>
      </section>

      {/* ─── ORGANIZATIONS SECTION ─── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Featured Organizations</h2>
            <p className="text-sm font-medium text-slate-500">Organizations making a difference in your city.</p>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-6 pb-4 snap-x custom-scrollbar">
          {orgs.map(org => (
            <div key={org._id} className="min-w-[300px] bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col items-center text-center shrink-0 snap-start">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 overflow-hidden border border-slate-200">
                {org.logoUrl ? <img src={org.logoUrl} className="w-full h-full object-cover"/> : <Building2 className="w-8 h-8 text-slate-400" />}
              </div>
              <h3 className="font-black text-lg text-slate-900 mb-1">{org.name}</h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-center gap-1"><MapPin className="w-3 h-3"/> {org.city}</p>
              
              <div className="w-full flex items-center justify-center gap-6 border-t border-slate-100 pt-4 mb-5">
                <div>
                  <p className="text-lg font-black text-slate-900">{org.completedDrivesCount || 0}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Drives</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div>
                  <p className="text-lg font-black text-slate-900">{org.activeMembers || 0}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Members</p>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setJoinName(user?.displayName || appUser?.name || "");
                  setJoinEmail(user?.email || appUser?.email || "");
                  setSelectedOrgForRegistration(org);
                }}
                className="w-full bg-green-50 border border-green-200 text-green-700 font-bold py-2 rounded-lg text-sm hover:bg-green-100 transition-colors"
              >
                 Join
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── BE A PART OF THE CHANGE CTA ─── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-[#f8faf6] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-sm">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Be a Part of the Change</h2>
            <p className="text-sm text-slate-600 font-medium mb-6">Join drives, follow organizations and inspire others.</p>
            <button className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-sm transition-colors shadow-lg">Explore Drives</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 md:gap-16">
            <div className="flex flex-col items-center text-center max-w-[160px]">
              <div className="w-20 h-20 mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                 <HeartHandshake className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="font-black text-slate-900 text-sm mb-1">Join Drives</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Take part in live community drives near you.</p>
            </div>
            <div className="flex flex-col items-center text-center max-w-[160px]">
              <div className="w-20 h-20 mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                 <Users className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="font-black text-slate-900 text-sm mb-1">Follow Organizations</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Stay updated with the work they are doing.</p>
            </div>
            <div className="flex flex-col items-center text-center max-w-[160px]">
              <div className="w-20 h-20 mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                 <Share2 className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="font-black text-slate-900 text-sm mb-1">Inspire Others</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Like, share and spread the word.</p>
            </div>
          </div>
        </div>
      </section>



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
      {/* ─── JOIN ORGANIZATION MODAL ─── */}
      {selectedOrgForRegistration && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrgForRegistration(null)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="font-black text-xl text-slate-900">Join Organization</h2>
              <button onClick={() => setSelectedOrgForRegistration(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleJoinOrg} className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="mb-6 pb-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 mb-1">{selectedOrgForRegistration.name}</h3>
                <p className="text-sm text-slate-500">Apply to become a volunteer member.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Full Name *</label>
                  <input required type="text" value={joinName} onChange={(e) => setJoinName(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email Address *</label>
                  <input required type="email" value={joinEmail} onChange={(e) => setJoinEmail(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" placeholder="john@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Age *</label>
                    <input required type="number" min="16" value={joinAge} onChange={(e) => setJoinAge(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" placeholder="18" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">City *</label>
                    <input required type="text" value={joinOrgCity} onChange={(e) => setJoinOrgCity(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" placeholder="Your City" />
                  </div>
                </div>
                <label className="flex items-start gap-3 mt-6 p-4 bg-slate-50 rounded-xl cursor-pointer border border-slate-100">
                  <input type="checkbox" checked={agreeGuidelines} onChange={(e) => setAgreeGuidelines(e.target.checked)} className="mt-1 w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500" />
                  <span className="text-xs text-slate-600 font-medium">I agree to follow the guidelines and policies of this organization. My membership is subject to approval.</span>
                </label>
              </div>

              <div className="mt-8">
                <button type="submit" disabled={isJoining} className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isJoining ? "Submitting Application..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
