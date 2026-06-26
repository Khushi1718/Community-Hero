"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Heart, MessageCircle, Share2, ShieldCheck, HeartHandshake, CheckCircle2,
  ChevronLeft, Users, Clock, Leaf, Trash2, MapPin, Calendar, Building2, User, AlertTriangle
} from "lucide-react";

export default function PostDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, appUser } = useAuth();
  const userId = user?.email || appUser?.email || "anonymous";

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/community/${id}`)
      .then(res => res.json())
      .then(data => {
        setPost(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSliderMove = (e: any) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post || post.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-6">
        <h2 className="text-2xl font-black text-slate-900 mb-2">Story Not Found</h2>
        <p className="text-slate-500 mb-6">The story you are looking for does not exist or has been removed.</p>
        <button onClick={() => router.push("/community")} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">Back to Community Hub</button>
      </div>
    );
  }

  const hasLiked = post.likes?.some((l: any) => l.userId === userId);
  
  const handleLike = async () => {
    setPost((prev: any) => {
      const liked = prev.likes.some((l: any) => l.userId === userId);
      return {
        ...prev,
        likes: liked ? prev.likes.filter((l: any) => l.userId !== userId) : [...prev.likes, { userId }]
      };
    });
    fetch(`/api/community/${id}/like`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId })
    });
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    const userName = user?.displayName || appUser?.name || "Community Member";
    try {
      await fetch(`/api/community/${id}/comment`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userName, text: commentText })
      });
      setCommentText("");
      const res = await fetch(`/api/community/${id}`);
      setPost(await res.json());
    } catch {}
  };

  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: post.title, text: post.resolutionSummary, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied!");
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-[120px]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
         <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
            <button onClick={() => router.push("/community")} className="flex items-center gap-2 text-slate-600 font-bold hover:text-slate-900 transition-colors">
               <ChevronLeft className="w-5 h-5"/> Back to Feed
            </button>
            <div className="flex items-center gap-2">
                {post.postType === "Municipal_Success" ? (
                    <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full">
                       <ShieldCheck className="w-3.5 h-3.5" /> Municipal Success
                    </span>
                ) : post.postType === "Self_Initiated" ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full">
                       <HeartHandshake className="w-3.5 h-3.5" /> Volunteer Driven
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full">
                       <CheckCircle2 className="w-3.5 h-3.5" /> Citizen Reported
                    </span>
                )}
            </div>
         </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            
            {/* ─── INTERACTIVE BEFORE/AFTER SLIDER ─── */}
            <div className="bg-white rounded-3xl p-2 border border-slate-200 shadow-sm overflow-hidden">
               {post.postType !== "Self_Initiated" && post.beforeImageUrls?.[0] && post.afterImageUrls?.[0] ? (
                 <div 
                   ref={sliderRef}
                   className="relative w-full aspect-[4/3] sm:aspect-video rounded-2xl overflow-hidden cursor-ew-resize select-none touch-none group bg-slate-900"
                   onMouseMove={handleSliderMove}
                   onTouchMove={(e) => handleSliderMove(e.touches[0])}
                 >
                   <img src={post.beforeImageUrls[0]} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
                   <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs font-black px-3 py-1.5 rounded uppercase tracking-wider">Before</div>
                   
                   <div 
                     className="absolute inset-y-0 right-0 overflow-hidden shadow-2xl"
                     style={{ width: `${100 - sliderPosition}%`, left: `${sliderPosition}%` }}
                   >
                      <img src={post.afterImageUrls[0]} alt="After" className="absolute inset-0 w-full h-full object-cover" style={{ left: `-${sliderPosition * (sliderRef.current?.getBoundingClientRect().width || 0) / 100}px`, maxWidth: 'none', width: sliderRef.current?.getBoundingClientRect().width || '100%' }} />
                      {/* We use object position hack or just a standard clip-path approach */}
                   </div>
                   
                   {/* Better Slider overlay */}
                   <div className="absolute inset-0 pointer-events-none" style={{ clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)` }}>
                      <img src={post.afterImageUrls[0]} alt="After" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                   </div>

                   <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-sm text-white text-xs font-black px-3 py-1.5 rounded uppercase tracking-wider shadow-lg z-10">After</div>

                   {/* Handle */}
                   <div 
                     className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20"
                     style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                   >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-xl">
                         <div className="w-1 h-3 border-l-2 border-r-2 border-slate-400"></div>
                      </div>
                   </div>
                 </div>
               ) : (
                 <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900">
                    <img src={post.afterImageUrls?.[0] || post.beforeImageUrls?.[0]} alt="Story Evidence" className="w-full h-full object-cover" />
                 </div>
               )}
            </div>

            {/* ─── STORY DETAILS ─── */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
               <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight">{post.title}</h1>
               <p className="text-lg text-slate-600 mb-8 leading-relaxed font-medium">{post.resolutionSummary}</p>
               
               {post.impactMetrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-slate-100 mb-8">
                     <div className="text-center">
                        <Users className="w-6 h-6 text-blue-500 mx-auto mb-2"/>
                        <p className="text-2xl font-black text-slate-900">{post.impactMetrics.volunteerCount}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Volunteers</p>
                     </div>
                     <div className="text-center">
                        <Clock className="w-6 h-6 text-emerald-500 mx-auto mb-2"/>
                        <p className="text-2xl font-black text-slate-900">{post.impactMetrics.volunteerHours}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total Hours</p>
                     </div>
                     {post.impactMetrics.wasteCollected && (
                       <div className="text-center">
                          <Trash2 className="w-6 h-6 text-amber-500 mx-auto mb-2"/>
                          <p className="text-2xl font-black text-slate-900">{post.impactMetrics.wasteCollected} kg</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Waste Collected</p>
                       </div>
                     )}
                     {post.impactMetrics.treesPlanted && (
                       <div className="text-center">
                          <Leaf className="w-6 h-6 text-green-500 mx-auto mb-2"/>
                          <p className="text-2xl font-black text-slate-900">{post.impactMetrics.treesPlanted}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Trees Planted</p>
                       </div>
                     )}
                  </div>
               )}

               {post.relatedIssue?.aiAnalysis?.severityReason && (
                 <div className="mt-8 bg-red-50/50 rounded-2xl p-6 border border-red-100">
                    <h3 className="text-sm font-black text-red-600 mb-3 uppercase tracking-wider flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> AI Severity Analysis</h3>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-red-50 text-sm text-red-900 font-medium">
                      <span className="font-bold text-red-500 block mb-1 text-[10px] uppercase tracking-wider">Reason</span>
                      {post.relatedIssue.aiAnalysis.severityReason}
                    </div>
                 </div>
               )}

               {post.relatedIssue?.resolutionVerification && (
                 <div className="mt-8 bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
                    <h3 className="text-sm font-black text-indigo-600 mb-3 uppercase tracking-wider flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> AI Resolution Verification</h3>
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                       <div className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 w-24 shrink-0 ${post.relatedIssue.resolutionVerification.isResolved ? "bg-success-50 border-success-200 text-success-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                          <span className="text-2xl font-black">{post.relatedIssue.resolutionVerification.confidence}%</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider mt-1 text-center">Confidence</span>
                       </div>
                       <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-50 flex-1 text-sm text-indigo-900 font-medium">
                          {post.relatedIssue.resolutionVerification.reasoning}
                       </div>
                    </div>
                 </div>
               )}

               {/* Timeline component */}
               {post.relatedIssue && (
                 <div className="mt-8">
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-slate-400"/> Issue Timeline</h3>
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
                       {post.relatedIssue.timeline?.map((item: any, i: number) => (
                          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                             <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-green-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                               <CheckCircle2 className="w-4 h-4 text-white"/>
                             </div>
                             <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                               <div className="flex items-center justify-between mb-1">
                                 <h4 className="font-bold text-slate-900 text-sm">{item.event.replace(/_/g, " ")}</h4>
                                 <span className="text-[10px] font-bold text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                               </div>
                               {item.actorName && <p className="text-xs text-slate-500">by {item.actorName}</p>}
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>
         </div>

         {/* ─── SIDEBAR ─── */}
         <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
               <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex gap-4">
                    <button onClick={handleLike} className="flex items-center gap-2 transition-transform active:scale-90 hover:opacity-70 group">
                       <Heart className={`w-6 h-6 ${hasLiked ? "fill-red-500 text-red-500" : "text-slate-400 group-hover:text-red-500"}`} />
                       <span className="font-bold text-slate-700 text-sm">{post.likes?.length || 0}</span>
                    </button>
                    <div className="flex items-center gap-2 text-slate-400">
                       <MessageCircle className="w-6 h-6" />
                       <span className="font-bold text-slate-700 text-sm">{post.comments?.length || 0}</span>
                    </div>
                  </div>
                  <button onClick={handleShare} className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors"><Share2 className="w-5 h-5 text-slate-600" /></button>
               </div>

               <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                     <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1"><Building2 className="w-5 h-5 text-slate-500"/></div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Department / Org</p>
                        <p className="font-bold text-slate-900 text-sm leading-tight">{post.department}</p>
                        {post.resolvedByName && <p className="text-xs text-slate-500 mt-1">{post.resolvedByName}</p>}
                     </div>
                  </div>
                  <div className="flex items-start gap-3">
                     <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1"><MapPin className="w-5 h-5 text-slate-500"/></div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Location</p>
                        <p className="font-bold text-slate-900 text-sm leading-tight">{post.location.address}</p>
                        <p className="text-xs text-slate-500 mt-1">{post.location.city}, {post.location.state}</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-3">
                     <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1"><User className="w-5 h-5 text-slate-500"/></div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Reported By</p>
                        <p className="font-bold text-slate-900 text-sm leading-tight">{post.reportedByName || "Community Member"}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
               <div className="p-4 border-b border-slate-100 shrink-0">
                  <h3 className="font-black text-slate-900 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-slate-400"/> Discussion</h3>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {post.comments?.length === 0 ? (
                     <div className="text-center text-slate-400 py-8">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-20"/>
                        <p className="text-sm font-medium">Be the first to comment</p>
                     </div>
                  ) : (
                     post.comments?.map((c: any) => (
                        <div key={c._id} className="flex gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">{c.userName.charAt(0).toUpperCase()}</div>
                           <div>
                              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100"><span className="font-bold text-slate-900 mr-2">{c.userName}</span>{c.text}</p>
                              <p className="text-[10px] text-slate-400 font-bold tracking-wide mt-1 ml-2">{new Date(c.createdAt).toLocaleDateString()}</p>
                           </div>
                        </div>
                     ))
                  )}
               </div>
               <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50 rounded-b-3xl flex gap-2">
                  <input type="text" placeholder="Add a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleComment(); }} className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-500 shadow-sm" />
                  <button onClick={handleComment} disabled={!commentText.trim()} className="px-4 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition-colors">Post</button>
               </div>
            </div>
         </div>
      </main>
    </div>
  );
}
