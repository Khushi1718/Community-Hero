"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { getIssues, Issue } from "@/lib/storage";
import { User, Activity, CheckCircle2, FileText, Settings, ShieldCheck, Trophy, Clock, Shield, Calendar, Users, Target, ArrowRight, Building2, MapPin, Search, Star, Award, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ProfilePage() {
  const { user, appUser, role, loading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [myIssues, setMyIssues] = useState<Issue[]>([]);
  const [data, setData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reports" | "drives" | "orgs" | "achievements" | "settings">("reports");

  const loadData = useCallback(async () => {
    if (!user && !appUser) return;
    const email = user?.email || appUser?.email;
    try {
       const res = await fetch(`/api/my-volunteering?email=${encodeURIComponent(email || "")}`);
       if (res.ok) setData(await res.json());

       const statsRes = await fetch(`/api/analytics/citizen?email=${encodeURIComponent(email || "")}`);
       if (statsRes.ok) setAnalytics(await statsRes.json());
       
       const certsRes = await fetch(`/api/certificates?volunteerEmail=${encodeURIComponent(email || "")}`);
       if (certsRes.ok) setCertificates(await certsRes.json());
       
       const allIssues = await getIssues();
       setMyIssues(allIssues.filter(i => i.citizenEmail === email));
    } catch {}
    setIsLoading(false);
  }, [user, appUser]);

  useEffect(() => {
    if (!loading) {
       if (!user && !appUser) router.push("/login");
       else if (role !== "citizen") router.push("/");
       else loadData();
    }
  }, [loading, user, appUser, role, loadData, router]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return <div className="min-h-screen flex items-center justify-center">{t("profile.error")}</div>;

  const totalReports = myIssues.length;
  const resolvedReports = myIssues.filter(i => i.status === "Resolved").length;
  const pendingReports = myIssues.filter(i => i.status === "Open" || i.status === "In Progress").length;

  const citizen = data.citizen;
  const drives = data.drives || [];
  const orgs = data.orgs || [];

  // Calculate real data from drives
  const calculatedCompletedDrives = drives.filter((d: any) => d.status === "completed" || d.status === "past").length;
  const calculatedHours = drives.filter((d: any) => d.status === "completed" || d.status === "past").reduce((acc: number, d: any) => acc + (d.hours || 2), 0);
  const points = calculatedCompletedDrives;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-[120px] animate-fade-in">
      
      {/* ─── HERO ─── */}
      <section className="bg-white border-b border-slate-300 pt-10 pb-10">
         <div className="max-w-[1200px] mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
               <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                  <div className="w-24 h-24 rounded bg-slate-100 flex items-center justify-center border border-slate-300 shrink-0 shadow-sm">
                     <span className="text-4xl font-bold text-slate-700">{((user?.displayName || appUser?.name || "C")[0]).toUpperCase()}</span>
                  </div>
                  <div className="mt-2">
                     <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center justify-center md:justify-start gap-2">
                       {user?.displayName || appUser?.name || "Verified Citizen"}
                       <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                         {t("profile.hero.badge")}
                       </span>
                     </h1>
                     <p className="text-slate-600 text-sm mb-3">{user?.email || appUser?.email}</p>
                     <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                       {t("profile.hero.level", { level: Math.floor((points || 0) / 100) + 1 })}
                     </p>
                  </div>
               </div>
               
               <div className="flex gap-0 border border-slate-200 rounded bg-slate-50 shadow-sm divide-x divide-slate-200">
                  <div className="p-4 px-6 text-center min-w-[100px]">
                     <p className="text-2xl font-bold text-slate-900">{points}</p>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("profile.hero.points")}</p>
                  </div>
                  <div className="p-4 px-6 text-center min-w-[100px]">
                     <p className="text-2xl font-bold text-slate-900">{calculatedHours}</p>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("profile.hero.hours")}</p>
                  </div>
                  <div className="p-4 px-6 text-center min-w-[100px]">
                     <p className="text-2xl font-bold text-slate-900">{calculatedCompletedDrives}</p>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("profile.hero.drives")}</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* ─── TABS ─── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 flex overflow-x-auto">
          {["reports", "drives", "orgs", "settings"].map((tab) => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab as any)} 
               className={`px-6 py-4 text-sm font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                 activeTab === tab 
                 ? "border-blue-600 text-blue-700 bg-blue-50/50" 
                 : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50"
               }`}
             >
               {tab === "reports" ? t("profile.tabs.reports") : tab === "drives" ? t("profile.tabs.drives") : tab === "orgs" ? t("profile.tabs.orgs") : t("profile.tabs.settings")}
             </button>
          ))}
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto px-4 mt-8">

         {/* ─── MY REPORTS ─── */}
         {activeTab === "reports" && (
            <div className="space-y-8">
               {/* Stats Grid */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
                   <div>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t("profile.reports.total")}</p>
                     <p className="text-3xl font-bold text-slate-900">{totalReports}</p>
                   </div>
                   <FileText className="w-8 h-8 text-slate-200" />
                 </div>
                 
                 <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex items-center justify-between border-l-4 border-l-green-600">
                   <div>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t("profile.reports.resolved")}</p>
                     <p className="text-3xl font-bold text-slate-900">{resolvedReports}</p>
                   </div>
                   <CheckCircle2 className="w-8 h-8 text-green-200" />
                 </div>

                 <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex items-center justify-between border-l-4 border-l-amber-500">
                   <div>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t("profile.reports.pending")}</p>
                     <p className="text-3xl font-bold text-slate-900">{pendingReports}</p>
                   </div>
                   <Activity className="w-8 h-8 text-amber-200" />
                 </div>
               </div>

               <div className="bg-white border border-slate-200 rounded shadow-sm">
                 <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t">
                   <h2 className="text-base font-bold text-slate-900">{t("profile.reports.recentTitle")}</h2>
                 </div>
                 {myIssues.length === 0 ? (
                    <div className="text-center py-10">
                       <p className="text-slate-500 text-sm mb-4">{t("profile.reports.noReports")}</p>
                       <button onClick={() => router.push("/report")} className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-bold shadow-sm">{t("profile.reports.button")}</button>
                    </div>
                 ) : (
                    <div className="divide-y divide-slate-100">
                       {myIssues.slice(0, 5).map((issue: any, index: number) => (
                          <div key={issue.id || issue._id || issue.issueId || index} onClick={() => router.push(`/issue/${issue.id || issue._id || issue.issueId}`)} className="flex items-center justify-between p-5 hover:bg-slate-50 cursor-pointer transition-colors">
                             <div className="flex-1">
                                <h3 className="font-bold text-slate-900 text-sm mb-1">{t(`categories.${issue.category}`, issue.category) as string} {t("categories.issueSuffix")}</h3>
                                <p className="text-xs text-slate-500 truncate max-w-lg">{issue.description}</p>
                             </div>
                             <div className="ml-4 text-right">
                                <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
                                   issue.status === 'Resolved' || issue.status === 'Closed' ? 'bg-green-50 text-green-700 border-green-200' :
                                   issue.status === 'Open' ? 'bg-red-50 text-red-700 border-red-200' :
                                   'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>{t(`status.${issue.status}`, issue.status) as string}</span>
                                <p className="text-xs text-slate-400 mt-2">{new Date(issue.timestamp).toLocaleDateString()}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
               </div>
            </div>
         )}

         {/* ─── MY DRIVES ─── */}
         {activeTab === "drives" && (
            <div className="space-y-8">
               <div className="bg-white border border-slate-200 rounded shadow-sm">
                 <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t flex justify-between items-center">
                   <h2 className="text-base font-bold text-slate-900">{t("profile.drives.title")}</h2>
                   <button onClick={() => router.push("/community")} className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors">{t("profile.drives.findDrives")}</button>
                 </div>
                 {drives.length === 0 ? (
                    <div className="text-center py-10">
                       <p className="text-slate-500 text-sm">{t("profile.drives.noDrives")}</p>
                    </div>
                 ) : (
                    <div className="divide-y divide-slate-100">
                       {drives.map((d: any) => {
                          const myStatus = d.volunteers?.find((v:any) => v.email === (user?.email || appUser?.email))?.status || "pending";
                          const statusColors: any = { pending: "bg-amber-50 text-amber-700 border-amber-200", approved: "bg-emerald-50 text-emerald-700 border-emerald-200", completed: "bg-blue-50 text-blue-700 border-blue-200", rejected: "bg-red-50 text-red-700 border-red-200" };
                          
                          return (
                             <div key={d._id} onClick={() => alert(`Drive Status: ${d.status}\nYour Status: ${myStatus}`)} className="flex items-center justify-between p-5 hover:bg-slate-50 cursor-pointer transition-colors">
                                <div className="flex-1">
                                   <h3 className="font-bold text-slate-900 text-sm mb-1">{d.title}</h3>
                                   <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(d.date).toLocaleDateString()}</span>
                                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {d.time}</span>
                                      <span className="flex items-center gap-1 truncate"><Building2 className="w-3.5 h-3.5" /> {d.acceptedOrgName || "Community Drive"}</span>
                                   </div>
                                </div>
                                <div className="ml-4 text-right flex flex-col items-end shrink-0">
                                   <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${statusColors[myStatus] || "bg-slate-50 text-slate-700 border-slate-200"}`}>{t(`status.${myStatus}`, myStatus) as string}</span>
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 )}
               </div>
            </div>
         )}

         {/* ─── ORGANIZATIONS ─── */}
         {activeTab === "orgs" && (
            <div className="space-y-8">
               <div className="bg-white border border-slate-200 rounded shadow-sm">
                 <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t flex justify-between items-center">
                   <h2 className="text-base font-bold text-slate-900">{t("profile.orgs.title")}</h2>
                   <button onClick={() => router.push("/community")} className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors">{t("profile.orgs.findOrgs")}</button>
                 </div>
                 {orgs.length === 0 ? (
                    <div className="text-center py-10">
                       <p className="text-slate-500 text-sm">{t("profile.orgs.noOrgs")}</p>
                    </div>
                 ) : (
                    <div className="divide-y divide-slate-100">
                       {orgs.map((o: any) => {
                          const myStatus = o.members?.find((m:any) => m.email === (user?.email || appUser?.email))?.status || "pending";
                          const statusColors: any = { pending: "bg-amber-50 text-amber-700 border-amber-200", approved: "bg-emerald-50 text-emerald-700 border-emerald-200", member: "bg-blue-50 text-blue-700 border-blue-200" };

                          return (
                             <div key={o._id} onClick={() => router.push(`/community/org/${o._id}`)} className="flex items-center justify-between p-5 hover:bg-slate-50 cursor-pointer transition-colors">
                                <div className="flex items-center gap-4 flex-1">
                                   <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                      {o.logoUrl ? <img src={o.logoUrl} className="w-full h-full object-cover" alt="org logo"/> : <Building2 className="w-5 h-5 text-slate-400"/>}
                                   </div>
                                   <div>
                                      <h3 className="font-bold text-slate-900 text-sm mb-1">{o.name}</h3>
                                      <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {o.city}, {o.state}</p>
                                   </div>
                                </div>
                                <div className="ml-4 text-right flex flex-col items-end shrink-0">
                                   <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${statusColors[myStatus] || "bg-slate-50 text-slate-700 border-slate-200"}`}>{t(`status.${myStatus}`, myStatus) as string}</span>
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 )}
               </div>
            </div>
         )}

         {/* ─── SETTINGS ─── */}
         {activeTab === "settings" && (
            <div className="bg-white border border-slate-200 rounded shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t">
                <h2 className="text-base font-bold text-slate-900">{t("profile.settings.title")}</h2>
              </div>
              
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">{t("profile.settings.notifTitle")}</h4>
                    <p className="text-xs text-slate-500">{t("profile.settings.notifDesc")}</p>
                  </div>
                  <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer ml-4 shrink-0">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">{t("profile.settings.locTitle")}</h4>
                    <p className="text-xs text-slate-500">{t("profile.settings.locDesc")}</p>
                  </div>
                  <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer ml-4 shrink-0">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
         )}
      </main>
    </div>
  );
}
