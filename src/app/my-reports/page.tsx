"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText, AlertTriangle, ChevronRight, CheckCircle2, Clock, Activity, Star, Send, X, MapPin, Camera } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";

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
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [issueTimeline, setIssueTimeline] = useState<any[]>([]);

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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
    completed: i => i.status === "Awaiting Citizen Review",
    closed: i => ["Closed", "Rejected"].includes(i.status),
  };
  const filteredIssues = allIssues.filter(filterMap[filterTab]);

  const FILTER_TABS: { id: FilterTab; label: string; count?: number }[] = [
    { id: "all", label: "All", count: allIssues.length },
    { id: "active", label: "Active", count: allIssues.filter(filterMap.active).length },
    { id: "inprogress", label: "In Progress", count: allIssues.filter(filterMap.inprogress).length },
    { id: "awaiting", label: "Awaiting Review", count: allIssues.filter(filterMap.awaiting).length },
    { id: "closed", label: "Closed", count: allIssues.filter(filterMap.closed).length },
  ];

  if (loading || isFetching) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 p-4 sm:p-8 animate-fade-in">
      <main className="max-w-4xl mx-auto">
        <Card className="shadow-float border-surface-200">
          <CardHeader className="border-b border-surface-100 bg-white pb-5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-info-100 rounded-2xl flex items-center justify-center border border-white shadow-inner-soft">
                <FileText className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-surface-900 tracking-tight">My Reports</h1>
                <p className="text-surface-500 text-sm mt-1 font-medium">Track and manage your submitted issues</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {FILTER_TABS.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setFilterTab(t.id)} 
                  className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${filterTab === t.id ? "bg-surface-900 text-white shadow-md" : "bg-surface-100 text-surface-600 hover:bg-surface-200"}`}
                >
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${filterTab === t.id ? "bg-white/20 text-white" : "bg-surface-200 text-surface-500"}`}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>
          </CardHeader>

          <div className="p-6 bg-surface-50/50 min-h-[400px]">
            {filteredIssues.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-surface-300" />
                </div>
                <h3 className="text-2xl font-bold text-surface-800 mb-2">
                  {filterTab === "all" ? "No Reports Yet" : `No ${filterTab.replace("inprogress", "in progress")} issues`}
                </h3>
                <p className="text-surface-500 mb-8 max-w-sm mx-auto">
                  {filterTab === "all" ? "You haven't reported any issues yet. Start making a difference in your community today." : "No issues in this category right now."}
                </p>
                {filterTab === "all" && (
                  <Button onClick={() => router.push("/report")} icon={<Camera className="w-4 h-4"/>}>
                    Report an Issue
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredIssues.map(issue => {
                  const isEscalated = (Date.now() - issue.timestamp > SEVEN_DAYS_MS) && !["Closed", "Rejected"].includes(issue.status);
                  const needsCitizenAction = issue.status === "Awaiting Citizen Review";

                  return (
                    <Card
                      key={issue.id}
                      hoverable
                      onClick={() => openIssue(issue)}
                      className={`border transition-all ${
                        needsCitizenAction ? "border-info-300 ring-2 ring-info-100 bg-info-50/10" :
                        isEscalated ? "border-error-300 bg-error-50/30" : "border-surface-200 bg-white"
                      }`}
                    >
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                        {issue.imageBase64 && (
                          <img src={issue.imageBase64} alt="Issue" className="w-full sm:w-28 h-40 sm:h-28 rounded-2xl object-cover border border-surface-100 shadow-sm flex-shrink-0" />
                        )}
                        <div className="flex-1 w-full min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-lg text-surface-900">{issue.aiAnalysis.category}</h3>
                              {isEscalated && (
                                <span className="bg-error-500 text-white text-[10px] uppercase font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                  <AlertTriangle className="w-3 h-3" />Escalated
                                </span>
                              )}
                              {needsCitizenAction && (
                                <span className="bg-info-500 text-white text-[10px] uppercase font-black px-2 py-1 rounded-full shadow-sm animate-pulse">
                                  ✋ Action Needed
                                </span>
                              )}
                            </div>
                            <StatusBadge status={issue.status} />
                          </div>

                          <div className="flex items-center flex-wrap gap-3 text-xs text-surface-500 font-medium mb-4">
                            <span className="font-mono bg-surface-100 px-2 py-1 rounded-md text-surface-600">{issue.id}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(issue.timestamp).toLocaleDateString()}</span>
                            {issue.assignedTo && <span className="flex items-center gap-1 text-primary-600 bg-primary-50 px-2 py-1 rounded-md">👷 {issue.assignedTo}</span>}
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full">
                            <div className="flex justify-between text-xs font-bold mb-1.5">
                              <span className="text-surface-600 uppercase tracking-wider text-[10px]">Resolution Progress</span>
                              <span className="text-primary-600">{issue.progressPercentage || 0}%</span>
                            </div>
                            <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden border border-surface-200/50">
                              <div className="bg-gradient-to-r from-primary-400 to-info-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${issue.progressPercentage || 0}%` }} />
                            </div>
                          </div>
                        </div>
                        <div className="hidden sm:flex w-10 h-10 rounded-full bg-surface-50 items-center justify-center flex-shrink-0 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                          <ChevronRight className="w-5 h-5 text-surface-400" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </main>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedIssue(null)} />
          <div className="relative bg-white rounded-t-[2rem] sm:rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl z-10 overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-surface-100 flex items-start justify-between flex-shrink-0 bg-white sticky top-0 z-20">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs font-semibold text-surface-500 bg-surface-100 px-2.5 py-1 rounded-md">{selectedIssue.id}</span>
                  <StatusBadge status={selectedIssue.status} />
                </div>
                <h2 className="text-2xl font-black text-surface-900 tracking-tight">{selectedIssue.aiAnalysis.category}</h2>
              </div>
              <button onClick={() => setSelectedIssue(null)} className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-surface-500 hover:bg-surface-200 hover:text-surface-900 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-50/30">
              {/* Issue Image */}
              {selectedIssue.imageBase64 && (
                <div className="relative rounded-2xl overflow-hidden shadow-sm border border-surface-200">
                  <img src={selectedIssue.imageBase64} alt="Issue" className="w-full h-56 sm:h-72 object-cover" />
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-surface-800 shadow-sm flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-500"/>
                    {selectedIssue.address || "Location Recorded"}
                  </div>
                </div>
              )}

              {/* Progress */}
              <div className="bg-white rounded-2xl p-5 border border-surface-200 shadow-sm">
                <div className="flex justify-between text-sm font-bold mb-3">
                  <span className="text-surface-700">Resolution Progress</span>
                  <span className="text-primary-600">{selectedIssue.progressPercentage || 0}%</span>
                </div>
                <div className="w-full bg-surface-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary-400 to-info-500 h-full rounded-full transition-all duration-1000" style={{ width: `${selectedIssue.progressPercentage || 0}%` }} />
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ["Department", selectedIssue.aiAnalysis.department || "—"],
                  ["Reported", new Date(selectedIssue.timestamp).toLocaleDateString()],
                  ["ETA", selectedIssue.eta ? new Date(selectedIssue.eta).toLocaleDateString() : "TBD"],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white border border-surface-200 rounded-2xl p-4 shadow-sm">
                    <p className="text-[10px] text-surface-400 font-bold uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-bold text-surface-800">{String(value)}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-surface-200 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] text-surface-400 font-bold uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-surface-700 leading-relaxed">{selectedIssue.description}</p>
              </div>

              {/* Timeline */}
              {issueTimeline.length > 0 && (
                <div className="bg-white border border-surface-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-5 flex items-center gap-2"><Activity className="w-4 h-4 text-info-500" />Activity Timeline</h3>
                  <div className="relative border-l-2 border-surface-100 ml-4 space-y-6">
                    {issueTimeline.map((event, i) => (
                      <div key={i} className="relative pl-6">
                        <div className="absolute w-4 h-4 rounded-full -left-[9px] top-0.5 bg-white border-2 border-info-400 shadow-sm" />
                        <p className="text-sm font-bold text-surface-800">{event.comment || event.action}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {event.actorName && <span className="text-[11px] font-semibold text-surface-500 bg-surface-100 px-2 py-0.5 rounded-md">{event.actorName}</span>}
                          <span className="text-[11px] font-medium text-surface-400">{new Date(event.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          {event.progressPercentage !== undefined && (
                            <span className="text-[10px] font-black bg-info-50 text-info-700 px-2 py-0.5 rounded-md border border-info-100">{event.progressPercentage}%</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Before/After */}
              {selectedIssue.resolutionProof && (
                <div className="bg-white border border-surface-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Camera className="w-4 h-4 text-success-500" />Verified Evidence</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-2">Original Report</p>
                      <img src={selectedIssue.imageBase64} alt="Before" className="w-full h-40 object-cover rounded-xl border border-surface-200 shadow-inner" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-success-600 uppercase tracking-wider mb-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Resolution</p>
                      <img src={selectedIssue.resolutionProof.imageBase64} alt="After" className="w-full h-40 object-cover rounded-xl border-2 border-success-400 shadow-sm" />
                    </div>
                  </div>
                  <div className="bg-success-50 rounded-xl p-4 mt-4 border border-success-100">
                    <p className="text-[10px] font-bold text-success-600 uppercase tracking-wider mb-1">Official Notes</p>
                    <p className="text-sm font-medium text-surface-800">{selectedIssue.resolutionProof.notes}</p>
                  </div>
                </div>
              )}

              {/* Citizen Feedback Form */}
              {selectedIssue.status === "Awaiting Citizen Review" && !selectedIssue.citizenFeedback && (
                <div className="bg-gradient-to-br from-info-50 to-primary-50 border border-info-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-black text-surface-900 mb-2 flex items-center gap-2"><Star className="w-5 h-5 text-warning-500" />Rate the Resolution</h3>
                  <p className="text-sm font-medium text-surface-600 mb-5">The municipal team marked this as complete. Verify the work and rate your experience.</p>
                  
                  <div className="flex gap-2 mb-5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button 
                        key={n} 
                        onClick={() => setFeedbackRating(n)} 
                        className={`w-12 h-12 rounded-2xl text-xl font-bold transition-all transform hover:scale-105 active:scale-95 ${
                          feedbackRating >= n 
                            ? "bg-warning-400 text-white shadow-md border border-warning-500" 
                            : "bg-white border-2 border-surface-200 text-surface-300 hover:border-warning-300"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea 
                    value={feedbackComment} 
                    onChange={e => setFeedbackComment(e.target.value)} 
                    placeholder="Share your experience or note any remaining issues (optional)…" 
                    className="w-full border-2 border-white bg-white/50 backdrop-blur rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-info-500 focus:bg-white mb-4 shadow-inner-soft transition-all" 
                    rows={3} 
                  />
                  <Button 
                    onClick={submitFeedback} 
                    disabled={!feedbackRating || isSubmittingFeedback} 
                    fullWidth
                    icon={<Send className="w-4 h-4" />}
                  >
                    {isSubmittingFeedback ? "Submitting…" : "Submit Verification"}
                  </Button>
                </div>
              )}

              {/* Existing Feedback Display */}
              {selectedIssue.citizenFeedback && (
                <div className="bg-white border border-warning-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-warning-100 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
                  <h3 className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-2 relative z-10">Your Verification</h3>
                  <div className="flex items-center gap-1 text-warning-400 text-2xl mb-3 relative z-10 drop-shadow-sm">
                    {"★".repeat(selectedIssue.citizenFeedback.rating)}{"☆".repeat(5 - selectedIssue.citizenFeedback.rating)}
                  </div>
                  {selectedIssue.citizenFeedback.comment && (
                    <div className="bg-surface-50 rounded-xl p-3 border border-surface-100 relative z-10">
                      <p className="text-sm font-medium text-surface-700 italic">"{selectedIssue.citizenFeedback.comment}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
