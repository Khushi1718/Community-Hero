"use client";

import { Brain, MapPin, Camera, Activity, FileText, CheckCircle2, TrendingUp, HeartHandshake, Zap } from "lucide-react";

export default function WhyCommunityHero() {
  const features = [
    { icon: Brain, title: "AI-Powered Verification", desc: "Computer vision and NLP instantly verify issues, filter duplicates, and assign severity.", color: "text-purple-600", bg: "bg-purple-100" },
    { icon: MapPin, title: "GPS & Timestamp Verified", desc: "Every report and resolution requires strict geospatial and temporal validation.", color: "text-blue-600", bg: "bg-blue-100" },
    { icon: Camera, title: "Media-Based Reporting", desc: "Rich evidence collection with high-resolution photos and video documentation.", color: "text-pink-600", bg: "bg-pink-100" },
    { icon: Activity, title: "Transparent Lifecycle", desc: "From submission to resolution, every state transition is publicly auditable.", color: "text-emerald-600", bg: "bg-emerald-100" },
    { icon: FileText, title: "Public Accountability", desc: "Before and after evidence is published to the community feed for all to see.", color: "text-amber-600", bg: "bg-amber-100" },
    { icon: Zap, title: "Smart Municipal Workflow", desc: "Automated routing and material request handling for optimized field operations.", color: "text-orange-600", bg: "bg-orange-100" },
    { icon: HeartHandshake, title: "Community Engagement", desc: "Citizens earn trust scores and build stronger communities through collaboration.", color: "text-rose-600", bg: "bg-rose-100" },
    { icon: TrendingUp, title: "Live Analytics Dashboard", desc: "Real-time KPIs and resolution metrics for data-driven municipal decisions.", color: "text-indigo-600", bg: "bg-indigo-100" },
  ];

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-sm font-black text-green-600 uppercase tracking-widest mb-4">Why It Matters</h2>
          <h3 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
            More than just reporting. <br/> A complete governance engine.
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="group p-8 rounded-3xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-green-200 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 transform hover:-translate-y-1">
              <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-3">{feature.title}</h4>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
