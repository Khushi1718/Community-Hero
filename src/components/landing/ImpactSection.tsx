"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ImpactSection() {
  const router = useRouter();

  return (
    <section className="py-32 bg-green-900 relative overflow-hidden text-center">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
      <div className="absolute w-[600px] h-[600px] bg-green-500/30 rounded-full blur-[100px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-green-800/50 border border-green-700/50 text-green-300 text-sm font-black tracking-widest uppercase mb-8 shadow-inner">
          <Sparkles className="w-4 h-4" /> The Future of Cities
        </div>
        
        <h2 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-8 tracking-tight">
          Digital Governance <br /> for <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-200">Everyone.</span>
        </h2>
        
        <p className="text-xl text-green-100/80 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
          Join the movement. Empower citizens, strengthen municipal operations, and build cleaner, smarter, more accountable communities.
        </p>
        
        <button 
          onClick={() => router.push("/report")} 
          className="bg-white text-green-900 hover:bg-green-50 hover:scale-105 transition-all duration-300 font-black text-lg px-10 py-5 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3 mx-auto"
        >
          Make an Impact Today
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
