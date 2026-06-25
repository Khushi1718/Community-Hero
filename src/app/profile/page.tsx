"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getIssues, Issue } from "@/lib/storage";
import { User, Activity, CheckCircle2, FileText, Settings, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [myIssues, setMyIssues] = useState<Issue[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (role !== "citizen") {
        router.push("/");
      } else {
        async function fetchIssues() {
          const allIssues = await getIssues();
          setMyIssues(allIssues.filter(i => i.citizenEmail === user?.email));
        }
        fetchIssues();
      }
    }
  }, [user, role, loading, router]);

  if (loading || !user || role !== "citizen") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalReports = myIssues.length;
  const resolvedReports = myIssues.filter(i => i.status === "Resolved").length;
  const pendingReports = myIssues.filter(i => i.status === "Open" || i.status === "In Progress").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-8">
      <main className="max-w-4xl mx-auto space-y-8">
        
        {/* Profile Header */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 sm:p-12 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-bl-full -z-10 opacity-70"></div>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner border-4 border-white">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Citizen Profile</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold w-max mx-auto sm:mx-0">
                  <ShieldCheck className="w-4 h-4" /> Verified Citizen
                </span>
              </div>
              <p className="text-lg text-slate-500 mb-6">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Posted</p>
              <p className="text-3xl font-black text-slate-900">{totalReports}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-700 uppercase tracking-wider mb-1">Resolved</p>
              <p className="text-3xl font-black text-slate-900">{resolvedReports}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Activity className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-1">Pending</p>
              <p className="text-3xl font-black text-slate-900">{pendingReports}</p>
            </div>
          </div>
        </div>

        {/* Account Actions (Placeholder for realism) */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-400" />
            Account Settings
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <h4 className="font-bold text-slate-800">Email Notifications</h4>
                <p className="text-sm text-slate-500">Get updates on your reported issues</p>
              </div>
              <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <h4 className="font-bold text-slate-800">Location Services</h4>
                <p className="text-sm text-slate-500">Allow auto-fetching location</p>
              </div>
              <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
