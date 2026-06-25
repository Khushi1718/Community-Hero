"use client";

import { ArrowRight, BarChart2, ShieldCheck, MapPin, Activity, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LandingHero() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  const handleCTA = () => {
    if (loading) return;
    if (!user) router.push("/login");
    else if (role === "citizen") router.push("/report");
    else if (role === "super_admin") router.push("/super-admin");
    else if (role === "admin") router.push("/admin");
    else if (role === "employee") router.push("/employee");
  };

  return (
    <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden bg-gradient-to-br from-green-50 via-white to-green-50/30 border-b border-slate-100">
      {/* Decorative background blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-200/40 rounded-full blur-[100px] -z-10 mix-blend-multiply" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-200/40 rounded-full blur-[100px] -z-10 mix-blend-multiply" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
          
          {/* Left Content */}
          <div className="flex-1 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center justify-center lg:justify-start gap-2 text-xs font-black text-green-700 bg-green-100/80 backdrop-blur-sm w-fit mx-auto lg:mx-0 px-4 py-2 rounded-full border border-green-200 mb-8 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
              </span>
              AI-Powered Civic Governance
            </div>

            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.05] mb-6">
              Transforming Civic Issue Reporting with <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">AI & Accountability.</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
              Community Hero is a complete civic governance ecosystem connecting Citizens, Municipalities, and City Administrators. Every issue is verified, tracked, resolved, and publicly visible.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12">
              <button onClick={handleCTA} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-xl shadow-green-600/20 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1">
                {user ? "Open Dashboard" : "Report an Issue"}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => router.push("/community")} className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-lg px-8 py-4 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1">
                <BarChart2 className="w-5 h-5 text-green-600" />
                Explore Live Dashboard
              </button>
            </div>
          </div>

          {/* Right Content - Mockup Dashboard */}
          <div className="flex-1 w-full relative">
            <div className="relative bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xl overflow-hidden transform hover:-translate-y-2 transition-transform duration-500 group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent z-0"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                    <span className="font-black text-slate-800 tracking-wide text-lg">Verification Core</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4">
                     <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600"><Zap className="w-6 h-6" /></div>
                     <div>
                       <p className="text-sm font-bold text-slate-900">AI Detection Engine</p>
                       <p className="text-xs text-slate-500 font-medium">Analyzing 452 reports/hour</p>
                     </div>
                     <div className="ml-auto text-green-600 font-black text-sm px-3 py-1 bg-green-50 rounded-full">Active</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4">
                     <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><MapPin className="w-6 h-6" /></div>
                     <div>
                       <p className="text-sm font-bold text-slate-900">Live GPS Tracking</p>
                       <p className="text-xs text-slate-500 font-medium">120+ active field operations</p>
                     </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4">
                     <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Activity className="w-6 h-6" /></div>
                     <div>
                       <p className="text-sm font-bold text-slate-900">Analytics Processing</p>
                       <p className="text-xs text-slate-500 font-medium">Real-time KPI generation</p>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
