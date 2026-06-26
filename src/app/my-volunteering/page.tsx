"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Trophy, Clock, CheckCircle2, Shield, Calendar, Users, Target, ArrowRight, Building2, MapPin, Search, Star, Award, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MyVolunteeringPage() {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"drives" | "orgs" | "achievements">("drives");

  const loadData = useCallback(async () => {
    if (!user && !appUser) return;
    const email = user?.email || appUser?.email;
    try {
       const res = await fetch(`/api/my-volunteering?email=${encodeURIComponent(email || "")}`);
       if (res.ok) setData(await res.json());

       const statsRes = await fetch(`/api/analytics/citizen?email=${encodeURIComponent(email || "")}`);
       if (statsRes.ok) setAnalytics(await statsRes.json());
    } catch {}
    setIsLoading(false);
  }, [user, appUser]);

  useEffect(() => {
    if (!loading) {
       if (!user && !appUser) router.push("/login");
       else loadData();
    }
  }, [loading, user, appUser, loadData, router]);

  if (isLoading || loading) return <div className="min-h-screen flex items-center justify-center">Loading your hero stats...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center">Error loading data.</div>;

  const citizen = data.citizen;
  const rankInfo = citizen?.communityInfo || { volunteerHours: 0, completedDrives: 0, points: 0, communityRank: "Newcomer", badges: [], achievements: [], certificates: [] };
  const drives = data.drives || [];
  const orgs = data.orgs || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-[120px]">
      
      {/* ─── HERO ─── */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 pt-16 pb-12 relative overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-20"></div>
         <div className="max-w-[1200px] mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
               <div className="w-24 h-24 rounded-3xl bg-emerald-500 flex items-center justify-center border-4 border-emerald-400 shadow-2xl shrink-0">
                  <span className="text-4xl font-black text-white">{((user?.displayName || appUser?.name || "C")[0]).toUpperCase()}</span>
               </div>
               <div className="flex-1">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-3 border border-emerald-500/30">
                     <Trophy className="w-3.5 h-3.5"/> Community Hero Level {Math.floor(rankInfo.points / 100) + 1}
                  </span>
                  <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{user?.displayName || appUser?.name || "Community Hero"}</h1>
                  <p className="text-slate-300 text-sm">Thank you for making our city a better place.</p>
               </div>
               
               <div className="flex gap-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 w-28">
                     <Star className="w-6 h-6 text-amber-400 mx-auto mb-2"/>
                     <p className="text-2xl font-black text-white">{rankInfo.points || 0}</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Points</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 w-28">
                     <Clock className="w-6 h-6 text-emerald-400 mx-auto mb-2"/>
                     <p className="text-2xl font-black text-white">{rankInfo.volunteerHours}</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hours</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 w-28 hidden sm:block">
                     <Target className="w-6 h-6 text-blue-400 mx-auto mb-2"/>
                     <p className="text-2xl font-black text-white">{rankInfo.completedDrives}</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drives</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* ─── TABS ─── */}
      <main className="max-w-[1200px] mx-auto px-4 mt-8">
         <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm w-full md:w-fit mb-8 overflow-x-auto">
            <button onClick={() => setActiveTab("drives")} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "drives" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>My Drives</button>
            <button onClick={() => setActiveTab("orgs")} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "orgs" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>Organizations</button>
            <button onClick={() => setActiveTab("achievements")} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "achievements" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>Achievements & Stats</button>
         </div>

         {/* ─── DRIVES ─── */}
         {activeTab === "drives" && (
            <div className="space-y-6">
               {drives.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6"><Calendar className="w-10 h-10 text-slate-300" /></div>
                     <h3 className="text-xl font-black text-slate-900 mb-2">No Drives Yet</h3>
                     <p className="text-slate-500 font-medium text-sm mb-6">Join community drives to start making an impact.</p>
                     <button onClick={() => router.push("/community")} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">Explore Hub</button>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {drives.map((d: any) => {
                        const myStatus = d.volunteers.find((v:any) => v.email === (user?.email || appUser?.email))?.status;
                        const statusColors: any = { pending: "bg-amber-100 text-amber-700", approved: "bg-emerald-100 text-emerald-700", completed: "bg-blue-100 text-blue-700", rejected: "bg-red-100 text-red-700" };
                        
                        return (
                           <div key={d._id} onClick={() => router.push(`/community/drive/${d._id}`)} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                              <div className="flex justify-between items-start mb-4">
                                 <div>
                                    <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-sm mb-2 ${statusColors[myStatus] || "bg-slate-100 text-slate-500"}`}>{myStatus}</span>
                                    <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{d.title}</h3>
                                 </div>
                                 <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors"><ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" /></div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="flex items-center gap-2 text-sm text-slate-600"><Calendar className="w-4 h-4 text-slate-400" /> <span className="font-medium">{new Date(d.date).toLocaleDateString()}</span></div>
                                 <div className="flex items-center gap-2 text-sm text-slate-600"><Clock className="w-4 h-4 text-slate-400" /> <span className="font-medium">{d.time}</span></div>
                                 <div className="flex items-center gap-2 text-sm text-slate-600 col-span-2 truncate"><Building2 className="w-4 h-4 text-slate-400 shrink-0" /> <span className="font-medium truncate">{d.acceptedOrgName || "Community Drive"}</span></div>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>
         )}

         {/* ─── ORGANIZATIONS ─── */}
         {activeTab === "orgs" && (
            <div className="space-y-6">
               {orgs.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6"><Building2 className="w-10 h-10 text-slate-300" /></div>
                     <h3 className="text-xl font-black text-slate-900 mb-2">No Organizations Joined</h3>
                     <p className="text-slate-500 font-medium text-sm mb-6">Connect with local NGOs and community groups.</p>
                     <button onClick={() => router.push("/community")} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">Find Organizations</button>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {orgs.map((o: any) => {
                        const myStatus = o.members.find((m:any) => m.email === (user?.email || appUser?.email))?.status;
                        const statusColors: any = { pending: "bg-amber-100 text-amber-700", approved: "bg-emerald-100 text-emerald-700", member: "bg-blue-100 text-blue-700" };

                        return (
                           <div key={o._id} onClick={() => router.push(`/community/org/${o._id}`)} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col">
                              <div className="flex justify-between items-start mb-4">
                                 <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                    {o.logoUrl ? <img src={o.logoUrl} className="w-full h-full object-cover"/> : <Building2 className="w-6 h-6 text-slate-400"/>}
                                 </div>
                                 <span className={`inline-flex text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-sm ${statusColors[myStatus] || "bg-slate-100 text-slate-500"}`}>{myStatus}</span>
                              </div>
                              <h3 className="text-lg font-black text-slate-900 leading-tight mb-1 group-hover:text-emerald-600 transition-colors line-clamp-2">{o.name}</h3>
                              <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-auto pt-4"><MapPin className="w-4 h-4 text-slate-400"/> {o.city}, {o.state}</p>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>
         )}

         {/* ─── ACHIEVEMENTS & STATS ─── */}
         {activeTab === "achievements" && (
            <div className="space-y-8">
               
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Points History */}
                  <div className="lg:col-span-2 space-y-6">
                     <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><TrendingUp className="w-6 h-6 text-slate-400" /> Point Transactions</h3>
                     <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        {analytics?.transactions?.length > 0 ? (
                           <div className="divide-y divide-slate-100">
                              {analytics.transactions.map((t: any) => (
                                 <div key={t._id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                    <div className="flex items-center gap-4">
                                       <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.isReversal ? "bg-red-100" : "bg-emerald-100"}`}>
                                          <Star className={`w-5 h-5 ${t.isReversal ? "text-red-500" : "text-emerald-500"}`} />
                                       </div>
                                       <div>
                                          <p className="font-bold text-slate-900 text-sm">{t.reason}</p>
                                          <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                                       </div>
                                    </div>
                                    <span className={`font-black text-lg ${t.isReversal ? "text-red-500" : "text-emerald-500"}`}>
                                       {t.isReversal ? "-" : "+"}{t.points}
                                    </span>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="p-12 text-center text-slate-400 font-bold">No points earned yet. Join a drive!</div>
                        )}
                     </div>
                  </div>

                  {/* Certificates */}
                  <div className="space-y-6">
                     <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><Award className="w-6 h-6 text-slate-400" /> Digital Certificates</h3>
                     <div className="space-y-4">
                        {rankInfo.certificates?.length > 0 ? (
                           rankInfo.certificates.map((certId: string) => (
                              <div key={certId} onClick={() => router.push(`/verify-certificate/${certId}`)} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-amber-400 cursor-pointer transition-colors group flex items-center gap-4">
                                 <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                                    <Award className="w-6 h-6 text-amber-500" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-900 text-sm truncate">Civic Impact Certificate</p>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {certId}</p>
                                 </div>
                                 <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500" />
                              </div>
                           ))
                        ) : (
                           <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
                              <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                              <p className="text-sm font-bold text-slate-400">Complete verified drives to earn certificates.</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* Badges / Achievements */}
               <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><Shield className="w-6 h-6 text-slate-400" /> Unlocked Badges</h3>
                  {rankInfo.badges?.length > 0 ? (
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {rankInfo.badges.map((b: string) => (
                           <div key={b} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center aspect-square hover:scale-105 transition-transform">
                              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                                 <Shield className="w-6 h-6 text-blue-500" />
                              </div>
                              <p className="font-bold text-slate-900 text-xs">{b}</p>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                        <Shield className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                        <p className="font-bold text-slate-500">No badges unlocked yet. Keep volunteering!</p>
                     </div>
                  )}
               </div>

            </div>
         )}
      </main>
    </div>
  );
}
