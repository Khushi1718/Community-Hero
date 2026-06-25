"use client";

import { CheckCircle2 } from "lucide-react";

export default function TransparencyTrust() {
  const lifecycle = [
    "Citizen submits report with GPS data.",
    "AI verifies image authenticity.",
    "City Admin approves and assigns.",
    "Employee performs field repair.",
    "Official Before & After evidence uploaded.",
    "Public community post published."
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          <div className="flex-1 max-w-2xl">
            <h2 className="text-sm font-black text-green-600 uppercase tracking-widest mb-4">Transparency & Trust</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-6">
              Building public trust through absolute transparency.
            </h3>
            <p className="text-lg text-slate-600 font-medium mb-10 leading-relaxed">
              In modern governance, accountability isn't optional. Community Hero ensures that the entire lifecycle of a civic issue—from the moment it is reported to the final bolt being tightened—is cryptographically auditable and publicly visible.
            </p>

            <div className="space-y-6">
              {lifecycle.map((step, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-slate-800 font-bold text-lg pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-2xl">
               <div className="absolute -top-6 -left-6 w-24 h-24 bg-green-500 rounded-full blur-[40px] opacity-20"></div>
               <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500 rounded-full blur-[40px] opacity-20"></div>
               
               <div className="relative z-10 space-y-4">
                 <div className="h-4 w-1/3 bg-slate-200 rounded-full mb-8"></div>
                 
                 {[1, 2, 3].map(i => (
                   <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-4">
                     <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0 animate-pulse"></div>
                     <div className="flex-1 space-y-2">
                       <div className="h-3 w-1/2 bg-slate-200 rounded-full"></div>
                       <div className="h-3 w-3/4 bg-slate-100 rounded-full"></div>
                     </div>
                   </div>
                 ))}
                 
                 <div className="mt-8 p-4 bg-green-50 rounded-2xl border border-green-200 flex items-center gap-3">
                   <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0 shadow-md">
                     <CheckCircle2 className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <p className="text-sm font-black text-green-900">Verified by Admin</p>
                     <p className="text-xs font-bold text-green-700">Timestamp: {new Date().toLocaleTimeString()}</p>
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
