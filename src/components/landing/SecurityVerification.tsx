"use client";

import { ShieldCheck, Lock, CheckSquare, EyeOff, MapPin, Clock, Camera, Brain } from "lucide-react";

export default function SecurityVerification() {
  const securityFeatures = [
    { icon: MapPin, title: "GPS Verification", desc: "Hardcoded EXIF analysis prevents spoofing." },
    { icon: Clock, title: "Temporal Integrity", desc: "Timestamps are validated against server time." },
    { icon: Camera, title: "In-App Capture", desc: "Forces live camera usage for official municipal workers." },
    { icon: Brain, title: "AI Duplication Checks", desc: "Prevents spamming the same issue across neighborhoods." },
    { icon: Lock, title: "Encrypted Data", desc: "End-to-end security for citizen privacy." },
    { icon: CheckSquare, title: "Admin Audit Logs", desc: "Every state transition is tracked immutably." }
  ];

  // Helper icons for dynamic mapping
  const getIcon = (name: string) => {
    switch (name) {
      case "GPS Verification": return MapPin;
      case "Temporal Integrity": return Clock;
      case "In-App Capture": return Camera;
      case "AI Duplication Checks": return Brain;
      case "Encrypted Data": return Lock;
      case "Admin Audit Logs": return CheckSquare;
      default: return ShieldCheck;
    }
  }

  // Imported locally above for mapping, wait, I'll just use the raw lucide-react imports inside the component.
  return (
    <section className="py-24 bg-white border-b border-slate-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 w-full relative">
            <div className="aspect-square max-w-md mx-auto relative">
              <div className="absolute inset-0 bg-green-500/10 rounded-full blur-[80px]"></div>
              <div className="relative w-full h-full bg-slate-900 rounded-full border-[8px] border-slate-800 flex items-center justify-center shadow-2xl">
                <ShieldCheck className="w-32 h-32 text-green-400" />
                
                {/* Orbiting Elements */}
                <div className="absolute inset-0 border border-slate-700 rounded-full animate-[spin_10s_linear_infinite]">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                </div>
                <div className="absolute inset-4 border border-slate-700/50 rounded-full animate-[spin_15s_linear_infinite_reverse]">
                  <div className="absolute bottom-4 left-4 w-4 h-4 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-2xl">
            <h2 className="text-sm font-black text-green-600 uppercase tracking-widest mb-4">Security & Verification</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-8">
              Bank-grade security. <br/> Municipal-grade accountability.
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {securityFeatures.map((feat, idx) => {
                const Icon = getIcon(feat.title);
                return (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0 border border-green-100">
                      <Icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{feat.title}</h4>
                      <p className="text-xs font-medium text-slate-500">{feat.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
