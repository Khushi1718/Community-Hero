"use client";

import { Scan, Cpu, Crosshair, Binary, Map, Mail, Cloud, ShieldAlert, ShieldCheck, Award, Server } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AIIntelligence() {
  const { t } = useTranslation();

  const features = [
    { icon: Scan, title: t("home.infrastructure.features.vision.title"), desc: t("home.infrastructure.features.vision.desc") },
    { icon: Cloud, title: t("home.infrastructure.features.pubsub.title"), desc: t("home.infrastructure.features.pubsub.desc") },
    { icon: Map, title: t("home.infrastructure.features.mapping.title"), desc: t("home.infrastructure.features.mapping.desc") },
    { icon: Mail, title: t("home.infrastructure.features.smtp.title"), desc: t("home.infrastructure.features.smtp.desc") },
    { icon: Crosshair, title: t("home.infrastructure.features.duplicate.title"), desc: t("home.infrastructure.features.duplicate.desc") },
    { icon: Binary, title: t("home.infrastructure.features.verification.title"), desc: t("home.infrastructure.features.verification.desc") },
    { icon: Cpu, title: t("home.infrastructure.features.assignment.title"), desc: t("home.infrastructure.features.assignment.desc") },
    { icon: Award, title: t("home.infrastructure.features.certificates.title"), desc: t("home.infrastructure.features.certificates.desc") },
  ];

  return (
    <section className="py-12 bg-white border-y border-slate-200 animate-fade-in">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-widest uppercase mb-6">
            <Server className="w-4 h-4" /> {t("home.infrastructure.tag")}
          </div>
          <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
            {t("home.infrastructure.title")}
          </h3>
          <p className="text-slate-600 font-medium text-lg leading-relaxed">
            {t("home.infrastructure.desc")}
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
