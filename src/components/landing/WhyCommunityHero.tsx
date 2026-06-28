"use client";

import Image from "next/image";

export default function WhyCommunityHero() {
  const features = [
    {
      title: "AI Triage & Anti-Spoofing",
      desc: "To combat duplicate complaints, our models cross-reference geospatial data. Hardcoded EXIF analysis and temporal validation prevent image spoofing and filter out manipulated media before it reaches city admins.",
      image: "/images/ai.png"
    },
    {
      title: "Verified Accountability",
      desc: "Tickets cannot be closed arbitrarily. Municipal employees must use in-app live camera capture to upload geofenced, timestamped 'After' photos from the exact location, proving the repair was genuinely completed.",
      image: "/images/verified.png"
    },
    {
      title: "Immutable Audit Logs",
      desc: "Every major state transition is securely tracked in immutable admin audit logs. This establishes a clear, auditable, public-facing timeline that helps bridge the trust gap between citizens and local government.",
      image: "/images/audit.png"
    },
    {
      title: "Encrypted Privacy & Routing",
      desc: "Citizen privacy is protected through end-to-end encrypted data transmission. Meanwhile, the platform leverages AI to securely assess and prioritize high-risk reports, escalating them to emergency teams.",
      image: "/images/routing.png"
    }
  ];

  return (
    <section className="py-24 bg-white border-y border-slate-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-sm font-black text-blue-700 uppercase tracking-widest mb-4">Security & Transparency</h2>
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-6 whitespace-nowrap">
            Accountability built into <span className="text-green-600">every step.</span>
          </h3>
          <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-3xl mx-auto">
            Community Hero is designed with bank-grade security to prevent spam, improve verification accuracy, and foster public trust through a cryptographically auditable workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="group bg-green-50/50 hover:bg-green-50 border border-green-100 rounded-2xl p-5 transition-colors flex flex-col h-full">
              <div className="relative h-48 mb-5 overflow-hidden bg-slate-100 border border-green-200/50 rounded-lg shadow-sm">
                <img 
                  src={feature.image} 
                  alt={feature.title} 
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-in-out" 
                />
              </div>
              <h4 className="text-lg font-bold text-green-950 mb-2">{feature.title}</h4>
              <p className="text-green-900/70 leading-relaxed text-sm flex-grow">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
