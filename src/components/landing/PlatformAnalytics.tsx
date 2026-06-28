"use client";

import { useRouter } from "next/navigation";

export default function PlatformAnalytics() {
  const router = useRouter();

  return (
    <section className="bg-white border-t border-slate-200 py-4">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 shrink-0 flex items-center justify-center">
            <img 
              src="/images/logo.png" 
              alt="Community Hero" 
              className="w-full h-full object-contain drop-shadow-sm" 
            />
          </div>
          <div>
            <p className="text-slate-800 text-base">
              <span className="font-bold text-slate-900">Want to make a difference?</span> Join the community or report a local issue today.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <button 
            onClick={() => router.push("/community")} 
            className="flex-1 md:flex-none px-5 py-2 rounded-lg border border-green-600 text-green-700 font-bold hover:bg-green-50 transition-colors text-sm"
          >
            Join Community
          </button>
          <button 
            onClick={() => router.push("/report")} 
            className="flex-1 md:flex-none px-5 py-2 rounded-lg bg-green-700 text-white font-bold hover:bg-green-800 transition-colors shadow-md shadow-green-700/20 text-sm"
          >
            Report Issue
          </button>
        </div>
      </div>
    </section>
  );
}
