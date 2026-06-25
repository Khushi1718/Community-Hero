"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getIssues, Issue } from "@/lib/storage";
import { ArrowLeft, CheckCircle2, Clock, MapPin, AlertTriangle, ShieldCheck, Send } from "lucide-react";

export default function ReportDetailPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [issue, setIssue] = useState<Issue | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (role !== "citizen") {
        router.push("/");
      } else if (params && params.id) {
        async function fetchIssue() {
          try {
             const res = await fetch(`/api/issues?citizenEmail=${encodeURIComponent(user?.email || "")}`);
             const myIssues = await res.json();
             const found = myIssues.find((i: any) => i.id === params!.id);
             if (found) {
               setIssue(found);
             } else {
               router.push("/my-reports");
             }
          } catch (err) {
             console.error(err);
          }
        }
        fetchIssue();
      }
    }
  }, [user, role, loading, router, params]);

  if (loading || !user || role !== "citizen" || !issue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const isEscalated = (Date.now() - issue.timestamp > SEVEN_DAYS_MS) && issue.status !== "Resolved" && issue.status !== "Rejected";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-8">
      <main className="max-w-3xl mx-auto">
        <button 
          onClick={() => router.push("/my-reports")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Reports
        </button>

        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-10 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{issue.aiAnalysis.category}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                  issue.status === 'Resolved' ? 'bg-green-100 text-green-700 border border-green-200' :
                  issue.status === 'In Progress' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                  issue.status === 'Rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                  'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {issue.status}
                </span>
                {isEscalated && (
                  <span className="bg-red-600 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <AlertTriangle className="w-3 h-3" /> Escalated
                  </span>
                )}
              </div>
              <p className="text-slate-500 flex items-center gap-2">
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{issue.id}</span>
                <span className="text-slate-300">•</span>
                <Clock className="w-4 h-4" /> {new Date(issue.timestamp).toLocaleString()}
              </p>
            </div>
            
            {issue.assignedTo && (
              <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-xl flex items-center gap-2 font-medium">
                <Send className="w-4 h-4" />
                Assigned: {issue.assignedTo}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Reported Image</h3>
              <img src={issue.imageBase64} alt="Reported Issue" className="w-full h-64 object-cover rounded-2xl border border-slate-200 shadow-sm" />
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">{issue.description}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Location</h3>
                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <MapPin className="w-5 h-5 text-blue-500" /> {issue.location}
                </div>
              </div>
            </div>
          </div>

          {/* Feature 8: Resolution Proof View */}
          {issue.status === "Resolved" && issue.resolutionProof && (
            <div className="mb-10 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-bl-full -z-10 opacity-50"></div>
              <h4 className="text-xl font-bold text-green-800 flex items-center gap-2 mb-6">
                <CheckCircle2 className="w-6 h-6" />
                Issue Resolved Successfully
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Before</p>
                  <img src={issue.imageBase64} alt="Before" className="w-full h-48 object-cover rounded-xl border border-slate-200 shadow-sm" />
                </div>
                <div>
                  <p className="text-xs font-bold text-green-600 uppercase mb-2">After</p>
                  <img src={issue.resolutionProof.imageBase64} alt="After" className="w-full h-48 object-cover rounded-xl border border-green-300 shadow-md ring-4 ring-green-100" />
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-green-100 text-sm text-slate-700 shadow-sm">
                <span className="font-bold text-green-800 block mb-1">Resolution Notes:</span>
                {issue.resolutionProof.notes}
              </div>
            </div>
          )}

          {/* Feature 7: Citizen Review Stage */}
          {issue.status === 'Awaiting Citizen Review' && (
            <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 mb-8 shadow-sm">
              <h3 className="text-xl font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" /> Review Resolution
              </h3>
              <p className="text-slate-600 mb-6">The assigned team has marked this issue as resolved. Please review the completion details below and confirm if the issue is fully fixed.</p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={async () => {
                     try {
                       await fetch(`/api/issues/${issue.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: "Closed", eventName: "Citizen Accepted Resolution", actorRole: "citizen", actorName: user.name })
                       });
                       alert("Resolution Accepted! The issue is now closed.");
                       router.push("/community");
                     } catch (err) {
                       console.error(err);
                     }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm"
                >
                  ✓ Accept Resolution
                </button>
                <button 
                  onClick={async () => {
                     const reason = prompt("Please provide a reason for reopening (e.g. Problem persists):");
                     if (reason) {
                       await fetch(`/api/issues/${issue.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: "In Progress", eventName: `Citizen Reopened Issue: ${reason}`, actorRole: "citizen", actorName: user.name })
                       });
                       alert("Issue Reopened! The assigned team has been notified.");
                       window.location.reload();
                     }
                  }}
                  className="flex-1 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold py-3 px-4 rounded-xl transition-colors shadow-sm"
                >
                  ✗ Reopen Issue
                </button>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-indigo-500" />
              Live Issue Timeline
            </h3>
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-8">
              {/* Combine timeline events and progress updates, sort by time */}
              {[...issue.timeline.map(e => ({ type: 'event', ...e })), ...(issue.progressUpdates || []).map(p => ({ type: 'update', ...p }))]
                .sort((a, b) => a.timestamp - b.timestamp)
                .map((item: any, idx, arr) => (
                <div key={idx} className="relative pl-8">
                  <div className={`absolute w-4 h-4 rounded-full -left-[9px] top-1 ring-4 ring-white shadow-sm ${
                    idx === arr.length - 1 ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}></div>
                  
                  {item.type === 'event' ? (
                    <>
                      <p className={`font-bold text-lg ${idx === arr.length - 1 ? 'text-slate-900' : 'text-slate-700'}`}>
                        {item.event}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                    </>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">🛠️</span>
                          Update from {item.author}
                        </p>
                        <p className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                      <p className="text-slate-700 text-sm mb-3">{item.note}</p>
                      
                      {item.progressPercentage !== undefined && (
                        <div className="mb-3">
                           <div className="flex justify-between text-xs font-bold mb-1">
                             <span className="text-slate-500">Progress</span>
                             <span className="text-indigo-600">{item.progressPercentage}%</span>
                           </div>
                           <div className="w-full bg-slate-200 rounded-full h-1.5">
                             <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${item.progressPercentage}%` }}></div>
                           </div>
                        </div>
                      )}
                      
                      {item.attachments && item.attachments.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto">
                          {item.attachments.map((att: string, i: number) => (
                            <img key={i} src={att} alt="Update attachment" className="h-20 w-32 object-cover rounded-lg border border-slate-200 flex-shrink-0" />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
