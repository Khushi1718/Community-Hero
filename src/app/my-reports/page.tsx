"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText, AlertTriangle, ChevronRight, CheckCircle2, Clock, Activity, Star, X, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Issue {
  id: string;
  _id?: string;
  citizenEmail: string;
  imageBase64: string;
  description: string;
  address?: string;
  state?: string;
  city?: string;
  timestamp: number;
  aiAnalysis: { category: string; severity: string; department: string; trust: any; reasoningPoints: string[] };
  status: string;
  priority?: string;
  assignedTo?: string;
  progressPercentage?: number;
  eta?: number;
  timeline: any[];
  resolutionProof?: { imageBase64: string; notes: string };
  citizenFeedback?: { rating: number; comment: string };
}

type FilterTab = "all" | "active" | "inprogress" | "awaiting" | "completed" | "closed";

export default function MyReportsPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [issueTimeline, setIssueTimeline] = useState<any[]>([]);

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push("/login"); return; }
      if (role !== "citizen") { router.push("/"); return; }
      loadIssues();
    }
  }, [user, role, loading, router]);

  const loadIssues = async () => {
    if (!user?.email) return;
    setIsFetching(true);
    try {
      const res = await fetch(`/api/issues?citizenEmail=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      setAllIssues(Array.isArray(data) ? data.sort((a: Issue, b: Issue) => b.timestamp - a.timestamp) : []);
    } catch (err) { console.error(err); }
    finally { setIsFetching(false); }
  };

  const openIssue = async (issue: Issue) => {
    setSelectedIssue(issue);
    setFeedbackRating(issue.citizenFeedback?.rating || 0);
    setFeedbackComment(issue.citizenFeedback?.comment || "");
    // Fetch public timeline for citizen
    try {
      const res = await fetch(`/api/issues/${issue.id}/timeline?role=citizen`);
      const tl = await res.json();
      setIssueTimeline(Array.isArray(tl) ? tl : []);
    } catch { setIssueTimeline(issue.timeline || []); }
  };

  const submitFeedback = async () => {
    if (!selectedIssue || !feedbackRating) { alert("Please select a rating."); return; }
    setIsSubmittingFeedback(true);
    try {
      await fetch(`/api/issues/${selectedIssue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citizenFeedback: { rating: feedbackRating, comment: feedbackComment },
          actorName: user?.displayName || user?.email || "Citizen",
          actorRole: "citizen"
        })
      });
      await loadIssues();
      setSelectedIssue(null);
      alert("Thank you for your feedback!");
    } catch { alert("Failed to submit feedback."); }
    finally { setIsSubmittingFeedback(false); }
  };

  // Filter logic
  const filterMap: Record<FilterTab, (i: Issue) => boolean> = {
    all: () => true,
    active: i => ["Reported", "Assigned", "Employee Accepted", "Travelling", "Reached Site"].includes(i.status),
    inprogress: i => ["Inspection Started", "Inspection Completed", "Work Started", "Work In Progress", "Waiting For Materials", "Paused", "Repair Completed"].includes(i.status),
    awaiting: i => ["Awaiting Admin Verification", "Awaiting Citizen Review"].includes(i.status),
    completed: i => ["Awaiting Citizen Review", "Completed", "Resolved"].includes(i.status),
    closed: i => ["Closed", "Rejected", "Completed", "Resolved", "Awaiting Citizen Review", "Repair Completed"].includes(i.status),
  };
  const filteredIssues = allIssues.filter(filterMap[filterTab]);

  const FILTER_TABS: { id: FilterTab; label: string; count?: number }[] = [
    { id: "all", label: t("myReports.filterTabs.all"), count: allIssues.length },
    { id: "active", label: t("myReports.filterTabs.active"), count: allIssues.filter(filterMap.active).length },
    { id: "inprogress", label: t("myReports.filterTabs.inprogress"), count: allIssues.filter(filterMap.inprogress).length },
    { id: "awaiting", label: t("myReports.filterTabs.awaiting"), count: allIssues.filter(filterMap.awaiting).length },
    { id: "closed", label: t("myReports.filterTabs.closed"), count: allIssues.filter(filterMap.closed).length },
  ];

  if (loading || isFetching) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-[80px]">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#edf9f4] to-white rounded-3xl border border-emerald-100 p-6 sm:p-7 shadow-xs flex items-center justify-between mb-8 relative overflow-hidden">
           <div className="flex items-center gap-5 z-10 relative">
             <div className="w-14 h-14 rounded-2xl border border-emerald-200 flex items-center justify-center shrink-0 bg-white shadow-xs">
               <FileText className="w-7 h-7 text-emerald-700" />
             </div>
             <div>
               <h1 className="text-2xl md:text-3xl font-black text-[#0f2d1e] mb-1">{t("myReports.title")}</h1>
               <p className="text-slate-600 text-sm font-medium">{t("myReports.subtitle")}</p>
             </div>
           </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-4 no-scrollbar">
          {FILTER_TABS.map(tabItem => (
            <button
              key={tabItem.id}
              onClick={() => setFilterTab(tabItem.id)}
              className={`flex items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${filterTab === tabItem.id ? "bg-green-800 text-white border border-green-800" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"}`}
            >
              {tabItem.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${filterTab === tabItem.id ? "bg-green-700 text-white" : "bg-slate-100 text-slate-500"}`}>{tabItem.count || 0}</span>
            </button>
          ))}
        </div>

        {/* List of Reports */}
        <div className="space-y-4 mb-8">
          {filteredIssues.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
               <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <h3 className="text-lg font-black text-slate-900 mb-2">{t("myReports.noReports.title")}</h3>
               <p className="text-sm font-medium text-slate-500 mb-6">{t("myReports.noReports.desc")}</p>
               <button onClick={() => router.push("/report")} className="bg-green-700 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-800 transition-colors">{t("myReports.noReports.button")}</button>
            </div>
          ) : (
            filteredIssues.map(issue => (
              <div key={issue.id} onClick={() => openIssue(issue)} className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row gap-5 items-center cursor-pointer hover:shadow-md transition-shadow group">
                 {/* Image */}
                 <div className="w-full sm:w-48 h-40 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                    {issue.imageBase64 ? (
                      <img src={issue.imageBase64} alt="Issue" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-slate-300" /></div>
                    )}
                 </div>

                 {/* Content */}
                 <div className="flex-1 w-full min-w-0">
                    <h3 className="font-black text-xl text-slate-900 mb-3 truncate">{t(`categories.${issue.aiAnalysis.category}`, issue.aiAnalysis.category) as string}</h3>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200">{issue.id}</span>
                      <span className="flex items-center gap-1.5 text-slate-500 text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white"><Clock className="w-3.5 h-3.5" />{new Date(issue.timestamp).toLocaleDateString("en-GB", {day:"numeric", month:"short", year:"numeric"})}</span>
                      <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1.5
                         ${issue.status.includes('Active') || issue.status.includes('Closed') || issue.status.includes('Completed') ? 'bg-green-100 text-green-700' : ''}
                         ${issue.status.includes('Progress') || issue.status.includes('Reported') || issue.status.includes('Assigned') ? 'bg-blue-100 text-blue-700' : ''}
                         ${issue.status.includes('Review') || issue.status.includes('Awaiting') ? 'bg-purple-100 text-purple-700' : ''}
                      `}>
                        {issue.status.includes('Closed') && <CheckCircle2 className="w-3.5 h-3.5"/>}
                        {issue.status.includes('Progress') && <Clock className="w-3.5 h-3.5"/>}
                        {issue.status.includes('Review') && <AlertTriangle className="w-3.5 h-3.5"/>}
                        {t(`status.${issue.status}`, issue.status) as string}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-500 flex items-center gap-2 mb-5 truncate">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      {issue.address || issue.city || t("myReports.issueCard.unknownLocation")}
                    </p>

                    <div>
                      <div className="flex justify-between items-end mb-2">
                         <span className="text-xs font-black text-slate-700">{t("myReports.progress")}</span>
                         <span className={`text-xs font-black ${issue.progressPercentage === 100 ? 'text-green-600' : 'text-blue-600'}`}>{issue.progressPercentage || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-full rounded-full ${issue.progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{width: `${issue.progressPercentage || 0}%`}}></div>
                      </div>
                    </div>
                 </div>

                 <div className="hidden sm:flex w-12 h-12 rounded-full bg-slate-50 items-center justify-center shrink-0 group-hover:bg-green-50 transition-colors">
                    <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-green-600" />
                 </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Banner */}
        <div className="bg-[#f2faee] border border-green-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm mb-12">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 text-green-700">
                 <FileText className="w-6 h-6" />
              </div>
              <div>
                 <h4 className="font-black text-slate-900 text-sm mb-0.5">{t("myReports.refreshBanner.title")}</h4>
                 <p className="text-xs font-medium text-slate-500">{t("myReports.refreshBanner.subtitle")}</p>
              </div>
           </div>
           <button onClick={loadIssues} className="bg-white border border-green-200 text-green-700 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-green-50 transition-colors shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
             {t("myReports.refreshBanner.button")}
           </button>
        </div>
      </main>

      {/* Modal View for detailed issue tracking */}
      {selectedIssue && (
         <div className="fixed inset-0 z-[1000] flex justify-end items-end sm:items-stretch">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedIssue(null)} />
           <div className="relative bg-white rounded-t-[2rem] sm:rounded-l-[2rem] sm:rounded-tr-none w-full sm:max-w-xl h-[85vh] sm:h-full flex flex-col shadow-2xl z-10 overflow-hidden animate-slide-in-right">
             <div className="p-6 border-b border-slate-100 flex items-start justify-between flex-shrink-0 bg-white sticky top-0 z-20">
               <div>
                 <div className="flex items-center gap-2 mb-2">
                   <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">{selectedIssue.id}</span>
                   <span className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase px-2 py-1 rounded-md">{t(`status.${selectedIssue.status}`, selectedIssue.status) as string}</span>
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t(`categories.${selectedIssue.aiAnalysis.category}`, selectedIssue.aiAnalysis.category) as string}</h2>
               </div>
               <button onClick={() => setSelectedIssue(null)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"><X className="w-5 h-5" /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
               {selectedIssue.imageBase64 && (
                 <img src={selectedIssue.imageBase64} alt="Issue" className="w-full h-56 object-cover rounded-2xl shadow-sm" />
               )}
               {selectedIssue.description && selectedIssue.description !== "-" && (
                 <p className="text-sm font-medium text-slate-700 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">{selectedIssue.description}</p>
               )}

               {/* Citizen Feedback Form */}
               {(selectedIssue.status === "Closed" || selectedIssue.status === "Resolved" || selectedIssue.status === "Awaiting Citizen Review") && (
                 <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                   <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                     <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                     {selectedIssue.citizenFeedback?.rating ? t("myReports.modal.feedback.thankYou") : t("myReports.modal.feedback.title")}
                   </h3>
                   
                   <div className="flex gap-2 text-2xl">
                     {[1, 2, 3, 4, 5].map((star) => (
                       <button
                         key={star}
                         type="button"
                         onClick={() => {
                           if (!selectedIssue.citizenFeedback?.rating) {
                             setFeedbackRating(star);
                           }
                         }}
                         className={`${
                           star <= (feedbackRating || selectedIssue.citizenFeedback?.rating || 0)
                             ? "text-amber-400"
                             : "text-slate-200"
                         } transition-colors`}
                         disabled={!!selectedIssue.citizenFeedback?.rating}
                       >
                         ★
                       </button>
                     ))}
                   </div>

                   {!selectedIssue.citizenFeedback?.rating ? (
                     <div className="space-y-3">
                       <textarea
                         placeholder={t("myReports.modal.feedback.placeholder")}
                         value={feedbackComment}
                         onChange={(e) => setFeedbackComment(e.target.value)}
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500"
                         rows={3}
                       />
                       <button
                         onClick={submitFeedback}
                         disabled={isSubmittingFeedback || !feedbackRating}
                         className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         {isSubmittingFeedback ? t("myReports.modal.feedback.submitting") : t("myReports.modal.feedback.submit")}
                       </button>
                     </div>
                   ) : (
                     <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                       "{selectedIssue.citizenFeedback.comment || t("myReports.modal.feedback.comment")}"
                     </p>
                   )}
                 </div>
               )}
               
               {/* Timeline */}
               {issueTimeline.length > 0 && (
                 <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" />{t("myReports.modal.timeline")}</h3>
                    <div className="relative border-l-2 border-slate-100 ml-4 space-y-6">
                      {issueTimeline.map((event, i) => (
                        <div key={i} className="relative pl-6">
                          <div className="absolute w-4 h-4 rounded-full -left-[9px] top-0.5 bg-white border-2 border-blue-400 shadow-sm" />
                          <p className="text-sm font-bold text-slate-800">{event.comment || event.action}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {event.actorName && <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{event.actorName}</span>}
                            <span className="text-[11px] font-medium text-slate-400">{new Date(event.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
             </div>
           </div>
         </div>
      )}
    </div>
  );
}
