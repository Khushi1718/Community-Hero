"use client";

import {
  Heart, MessageCircle, Share2, Award, ShieldCheck, BadgeCheck,
  CheckCircle, Search, ThumbsUp, HeartHandshake, Users, MapPin,
  AlertTriangle, CheckCircle2, Clock, Send, X, BarChart2, TrendingUp, Building2, Eye,
  ChevronLeft, ChevronRight, MoreHorizontal, Bookmark, User
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Post {
  _id: string;
  issueId: string;
  title: string;
  category?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
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
  comments: { _id: string; userId: string; userName: string; text: string; createdAt: string }[];
  views: number;
}

interface Stats {
  totalResolved: number;
  totalIssues: number;
  avgResolutionHours: number;
  topDepartment: string;
}

export default function CommunityPage() {
  const { user, appUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<Stats>({ totalResolved: 0, totalIssues: 0, avgResolutionHours: 0, topDepartment: "—" });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  
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
      const [postsRes, statsRes] = await Promise.all([
        fetch("/api/community"),
        fetch("/api/community?statsOnly=true")
      ]);
      const postsData = await postsRes.json();
      const statsData = await statsRes.json();
      if (Array.isArray(postsData)) setPosts(postsData);
      if (statsData && !statsData.error) setStats(statsData);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Scroll to bottom of comments when modal opens or new comment added
  useEffect(() => {
    if (activePostForComments && commentsEndRef.current) {
       commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activePostForComments?.comments]);

  const handleLike = async (postId: string) => {
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p._id !== postId) return p;
      const hasLiked = p.likes.some(l => l.userId === userId);
      return {
        ...p,
        likes: hasLiked
          ? p.likes.filter(l => l.userId !== userId)
          : [...p.likes, { userId }],
        upvotes: hasLiked ? p.upvotes - 1 : p.upvotes + 1
      };
    }));

    // Update modal state if open
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
    } catch { loadData(); } // revert on error
  };

  const handleComment = async () => {
    if (!activePostForComments || !commentText.trim()) return;
    setIsSubmitting(true);
    const postId = activePostForComments._id;
    try {
      await fetch(`/api/community/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userName, text: commentText })
      });
      setCommentText("");
      await loadData();
      
      // Update active post seamlessly
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
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.log("Error sharing", err);
    }
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
      
      {/* ─── PREMIUM HERO ─── */}
      <section className="relative bg-white border-b border-slate-200 overflow-hidden pt-12 pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50"></div>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          
          <div className="flex-1 max-w-2xl text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-4">
              Our Community, <br/> Our Responsibility
            </h1>
            <p className="text-lg text-slate-600 font-medium max-w-xl mx-auto md:mx-0 mb-10">
              See issues reported by citizens, track their progress, and celebrate resolutions. Together we build a better community.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="text-xl font-black text-slate-900 leading-none">{stats.totalIssues.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-wider">Reported</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="text-xl font-black text-slate-900 leading-none">{stats.totalResolved.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-wider">Resolved</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-xl font-black text-slate-900 leading-none">95%</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-wider">Resolution</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="text-xl font-black text-slate-900 leading-none">2.4M+</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-wider">Impacted</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-lg hidden lg:block relative">
             <div className="absolute inset-0 bg-green-500/10 rounded-[3rem] blur-3xl transform rotate-3"></div>
             <img src="/images/hero.png" alt="Community Hero Team" className="w-full relative z-10 drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
      </section>

      <main className="max-w-[600px] mx-auto p-4 sm:p-6 mt-6">

        {/* Filters */}
        <div className="mb-10 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search resolved issues…" className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none shadow-sm transition-all placeholder:text-slate-400" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {departments.map(dept => (
              <button key={dept} onClick={() => setFilterDept(dept)} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${filterDept === dept ? "bg-slate-900 text-white shadow-md" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Posts */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No resolved issues found</h3>
            <p className="text-slate-500 font-medium text-sm">When issues are verified and completed, they'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredPosts.map(post => {
              const hasLiked = post.likes.some(l => l.userId === userId);
              
              return (
                <article key={post._id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  
                  {/* Card Header */}
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
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Media (Instagram style square/4:3) */}
                  <div className="aspect-[4/3] bg-slate-900 relative group">
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                       <span className="inline-flex items-center gap-1.5 bg-green-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                       </span>
                    </div>

                    {/* Split View for Before/After */}
                    <div className="w-full h-full flex">
                       <div className="w-1/2 h-full relative border-r border-slate-800/50">
                          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[9px] font-black px-2 py-1 rounded">BEFORE</div>
                          {post.beforeImageUrl ? (
                            <img src={post.beforeImageUrl} alt="Before" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-slate-600" /></div>
                          )}
                       </div>
                       <div className="w-1/2 h-full relative">
                          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[9px] font-black px-2 py-1 rounded">AFTER</div>
                          {post.afterImageUrl ? (
                            <img src={post.afterImageUrl} alt="After" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center"><CheckCircle className="w-8 h-8 text-slate-600" /></div>
                          )}
                       </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-4 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleLike(post._id)} className="transition-transform active:scale-90 hover:opacity-70">
                        <Heart className={`w-7 h-7 ${hasLiked ? "fill-red-500 text-red-500" : "text-slate-800"}`} />
                      </button>
                      <button onClick={() => setActivePostForComments(post)} className="transition-transform active:scale-90 hover:opacity-70">
                        <MessageCircle className="w-7 h-7 text-slate-800" />
                      </button>
                      <button onClick={() => handleShare(post)} className="transition-transform active:scale-90 hover:opacity-70">
                        <Share2 className="w-6 h-6 text-slate-800" />
                      </button>
                    </div>
                  </div>

                  {/* Likes & Content */}
                  <div className="px-4 pb-4 space-y-2">
                    <p className="font-bold text-slate-900 text-sm">
                      {post.likes.length.toLocaleString()} likes
                    </p>
                    
                    <div>
                      <span className="font-bold text-slate-900 text-sm mr-2">{post.reportedByName || "Citizen"}</span>
                      <span className="text-sm text-slate-800">{post.title} — {post.resolutionSummary}</span>
                    </div>

                    {post.comments.length > 0 && (
                      <button onClick={() => setActivePostForComments(post)} className="text-sm text-slate-500 font-medium hover:text-slate-700">
                        View all {post.comments.length} comments
                      </button>
                    )}

                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide pt-1">
                      {new Date(post.resolvedAt).toLocaleDateString()} • {formatResolutionTime(post.resolutionTimeHours)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── INSTAGRAM-STYLE COMMENTS MODAL ─── */}
      {activePostForComments && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-12">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActivePostForComments(null)}></div>
          
          {/* Modal Container */}
          <div className="relative w-full h-full md:h-auto md:max-h-full max-w-5xl bg-white md:rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Left: Media (Hidden on very small screens, visible on md+) */}
            <div className="hidden md:flex flex-1 bg-slate-900 items-center justify-center relative">
               <div className="w-full h-full flex">
                  <div className="w-1/2 h-full relative border-r border-slate-800">
                    {activePostForComments.beforeImageUrl ? (
                      <img src={activePostForComments.beforeImageUrl} alt="Before" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="w-1/2 h-full relative">
                    {activePostForComments.afterImageUrl ? (
                      <img src={activePostForComments.afterImageUrl} alt="After" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
               </div>
            </div>

            {/* Right: Comments Section */}
            <div className="flex flex-col w-full md:w-[400px] lg:w-[450px] h-full md:max-h-[85vh] bg-white">
              {/* Modal Header */}
              <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                     <Building2 className="w-4 h-4 text-green-700" />
                   </div>
                   <p className="font-bold text-slate-900 text-sm">{activePostForComments.department}</p>
                 </div>
                 <button onClick={() => setActivePostForComments(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                   <X className="w-5 h-5 text-slate-900" />
                 </button>
              </div>

              {/* Comments Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {/* Original Post Caption */}
                 <div className="flex gap-3 mb-6 pb-4 border-b border-slate-100">
                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                     <User className="w-4 h-4 text-slate-500" />
                   </div>
                   <div>
                     <p className="text-sm"><span className="font-bold text-slate-900 mr-2">{activePostForComments.reportedByName || "Citizen"}</span>{activePostForComments.title} — {activePostForComments.resolutionSummary}</p>
                     <p className="text-xs text-slate-400 mt-1">{new Date(activePostForComments.resolvedAt).toLocaleDateString()}</p>
                   </div>
                 </div>

                 {/* Comments List */}
                 {activePostForComments.comments.map(c => (
                   <div key={c._id} className="flex gap-3">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200 flex items-center justify-center font-bold text-green-700 text-xs shrink-0">
                       {c.userName.charAt(0).toUpperCase()}
                     </div>
                     <div className="flex-1">
                       <p className="text-sm"><span className="font-bold text-slate-900 mr-2">{c.userName}</span>{c.text}</p>
                       <div className="flex items-center gap-4 mt-1">
                         <p className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</p>
                         <button className="text-xs font-bold text-slate-400 hover:text-slate-600">Reply</button>
                       </div>
                     </div>
                     <button className="self-center p-2"><Heart className="w-3 h-3 text-slate-300 hover:text-red-500" /></button>
                   </div>
                 ))}
                 <div ref={commentsEndRef} />
              </div>

              {/* Action Bar (Likes) */}
              <div className="p-4 border-t border-slate-200 shrink-0">
                <div className="flex items-center gap-4 mb-3">
                  <button onClick={() => handleLike(activePostForComments._id)} className="transition-transform active:scale-90 hover:opacity-70">
                    <Heart className={`w-6 h-6 ${activePostForComments.likes.some(l => l.userId === userId) ? "fill-red-500 text-red-500" : "text-slate-800"}`} />
                  </button>
                  <button className="transition-transform active:scale-90 hover:opacity-70">
                    <MessageCircle className="w-6 h-6 text-slate-800" />
                  </button>
                  <button onClick={() => handleShare(activePostForComments)} className="transition-transform active:scale-90 hover:opacity-70">
                    <Share2 className="w-6 h-6 text-slate-800" />
                  </button>
                </div>
                <p className="font-bold text-slate-900 text-sm mb-1">{activePostForComments.likes.length.toLocaleString()} likes</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">{new Date(activePostForComments.resolvedAt).toLocaleDateString()}</p>
              </div>

              {/* Comment Input */}
              <div className="h-16 border-t border-slate-200 flex items-center px-4 shrink-0 bg-slate-50">
                 <input 
                   type="text"
                   placeholder="Add a comment..."
                   className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
                   value={commentText}
                   onChange={e => setCommentText(e.target.value)}
                   onKeyDown={e => { if (e.key === "Enter") handleComment(); }}
                 />
                 <button 
                   onClick={handleComment}
                   disabled={!commentText.trim() || isSubmitting}
                   className="text-green-600 font-bold text-sm px-2 disabled:opacity-50 transition-opacity"
                 >
                   Post
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
