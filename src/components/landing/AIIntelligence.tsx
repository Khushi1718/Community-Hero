"use client";

import { Scan, FileSearch, ShieldAlert, Cpu, Crosshair, BarChart, Binary, Camera, Video, AlertTriangle } from "lucide-react";

export default function AIIntelligence() {
  const aiFeatures = [
    { icon: Scan, title: "Computer Vision", desc: "Extracts deep insights directly from citizen-uploaded imagery." },
    { icon: Crosshair, title: "Duplicate Detection", desc: "Prevents spam by spatially matching incoming issues with live data." },
    { icon: AlertTriangle, title: "Severity Prediction", desc: "Automatically flags high-risk issues for immediate escalation." },
    { icon: ShieldAlert, title: "Fake Report Filtering", desc: "Identifies digitally altered or irrelevant images to protect operations." },
    { icon: Binary, title: "Metadata Verification", desc: "Examines EXIF data to ensure temporal and geospatial accuracy." },
    { icon: Cpu, title: "Smart Assignment", desc: "Routes validated tasks to the correct municipal department instantly." },
  ];

  return (
    <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute w-[800px] h-[800px] bg-green-500/10 rounded-full blur-[120px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-green-400 text-xs font-black tracking-widest uppercase mb-6">
            <Cpu className="w-4 h-4" /> Powered by Gemini Vision
          </div>
          <h3 className="text-3xl md:text-5xl font-black text-white leading-tight mb-6">
            Artificial Intelligence at the Core.
          </h3>
          <p className="text-slate-400 font-medium text-lg">
            Our proprietary AI pipeline analyzes every submission in real-time, completely automating triage, verification, and assignment so your city can focus on taking action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiFeatures.map((feature, idx) => (
            <div key={idx} className="group p-8 rounded-3xl bg-slate-900/50 backdrop-blur-md border border-slate-800 hover:border-green-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(34,197,94,0.1)]">
              <div className="w-12 h-12 rounded-xl bg-slate-800 text-green-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-green-500/20 transition-all duration-300">
                <feature.icon className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-3">{feature.title}</h4>
              <p className="text-sm font-medium text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
