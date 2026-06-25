"use client";

import { ShieldCheck, MapPin, Clock, ThumbsUp } from "lucide-react";

export default function CommunityFeedPreview() {
  return (
    <section className="py-24 bg-slate-50 border-b border-slate-200 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-sm font-black text-green-600 uppercase tracking-widest mb-4">Community Impact</h2>
          <h3 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
            See the difference. Live.
          </h3>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Decorative background elements */}
          <div className="absolute -inset-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-[3rem] blur-xl opacity-20"></div>
          
          <div className="relative bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                  <img src="https://i.pravatar.cc/100?img=33" alt="User" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Pothole Repair - Sector 4</p>
                  <p className="text-xs text-slate-500 font-medium">Reported by Rahul S.</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">Officially Verified</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Before */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 group">
                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-black px-2 py-1 rounded shadow-sm z-10">BEFORE</div>
                <div className="aspect-video bg-slate-200 relative">
                  <img src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80" alt="Pothole before" className="w-full h-full object-cover grayscale-[30%]" />
                </div>
              </div>
              {/* After */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 group">
                <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-black px-2 py-1 rounded shadow-sm z-10">AFTER</div>
                <div className="aspect-video bg-slate-200 relative">
                  <img src="https://images.unsplash.com/photo-1584464491033-c5f080251786?auto=format&fit=crop&w=800&q=80" alt="Road after" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Rohtak, HR</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Resolved in 4h 12m</span>
                </div>
              </div>
              <button className="flex items-center gap-2 text-slate-500 hover:text-green-600 transition-colors">
                <ThumbsUp className="w-5 h-5" />
                <span className="font-bold">245</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
