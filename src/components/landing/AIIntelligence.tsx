"use client";

import { Scan, Cpu, Crosshair, Binary, Map, Mail, Cloud, ShieldAlert, ShieldCheck, Award, Server } from "lucide-react";

export default function AIIntelligence() {
  const features = [
    { icon: Scan, title: "AI Computer Vision", desc: "Extracts deep insights from citizen-uploaded imagery using Gemini Vision." },
    { icon: Cloud, title: "Google Cloud Pub/Sub", desc: "Real-time, secure data exchange with external municipal legacy systems." },
    { icon: Map, title: "Geospatial Mapping", desc: "Live tracking and precise GPS coordination for all field operations." },
    { icon: Mail, title: "Automated SMTP Mail", desc: "Reliable email sending and real-time notifications for citizens and staff." },
    { icon: Crosshair, title: "Duplicate Detection", desc: "Prevents spam by spatially matching incoming issues with active reports." },
    { icon: Binary, title: "Metadata Verification", desc: "Examines EXIF data to ensure temporal and geospatial accuracy of evidence." },
    { icon: Cpu, title: "Smart Task Assignment", desc: "Automatically routes validated tasks to the correct municipal department." },
    { icon: Award, title: "Cryptographic Certificates", desc: "Generates verifiable digital certificates for civic volunteers and NGOs." },
  ];

  return (
    <section className="py-12 bg-white border-y border-slate-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-widest uppercase mb-6">
            <Server className="w-4 h-4" /> Core Platform Infrastructure
          </div>
          <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
            Secure, Scalable, and Smart.
          </h3>
          <p className="text-slate-600 font-medium text-lg leading-relaxed">
            Our platform leverages industry-leading technologies to ensure high reliability, data integrity, and automated efficiency for municipal governance.
          </p>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory pb-6 -mx-4 px-4 md:-mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {features.map((feature, idx) => (
            <div key={idx} className="w-[85vw] shrink-0 snap-center md:w-auto p-8 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 text-blue-700 flex items-center justify-center mb-6 shadow-sm">
                <feature.icon className="w-6 h-6 stroke-[2]" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">{feature.title}</h4>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
