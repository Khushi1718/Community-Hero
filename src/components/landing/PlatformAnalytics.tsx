"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

export default function PlatformAnalytics() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = [
    { label: "Issues Reported", value: "14,520+" },
    { label: "Issues Resolved", value: "12,840+" },
    { label: "Avg Resolution Time", value: "24 hrs" },
    { label: "Active Cities", value: "120+" },
    { label: "Registered Citizens", value: "45,000+" },
    { label: "Municipal Employees", value: "1,200+" },
    { label: "AI Accuracy", value: "99.8%" },
    { label: "Citizen Satisfaction", value: "4.8/5" },
  ];

  if (!mounted) return null;

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-sm font-black text-green-600 uppercase tracking-widest mb-4">Platform Analytics</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
              Scale & Impact.
            </h3>
          </div>
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-200">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-sm">Live Network Status</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:-translate-y-2 transition-transform duration-300">
              <p className="text-3xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight">{stat.value}</p>
              <p className="text-sm md:text-base font-bold text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
