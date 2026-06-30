"use client";

import { Smartphone, Brain, AlertTriangle, UserCog, Wrench, UploadCloud, CheckCircle, Rss } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function WorkflowTimeline() {
  const { t } = useTranslation();

  const steps = [
    { icon: Smartphone, title: t("home.workflow.steps.step1.title"), desc: t("home.workflow.steps.step1.desc") },
    { icon: Brain, title: t("home.workflow.steps.step2.title"), desc: t("home.workflow.steps.step2.desc") },
    { icon: AlertTriangle, title: t("home.workflow.steps.step3.title"), desc: t("home.workflow.steps.step3.desc") },
    { icon: UserCog, title: t("home.workflow.steps.step4.title"), desc: t("home.workflow.steps.step4.desc") },
    { icon: Wrench, title: t("home.workflow.steps.step5.title"), desc: t("home.workflow.steps.step5.desc") },
    { icon: UploadCloud, title: t("home.workflow.steps.step6.title"), desc: t("home.workflow.steps.step6.desc") },
    { icon: CheckCircle, title: t("home.workflow.steps.step7.title"), desc: t("home.workflow.steps.step7.desc") },
    { icon: Rss, title: t("home.workflow.steps.step8.title"), desc: t("home.workflow.steps.step8.desc") },
  ];

  return (
    <section className="py-16 bg-[#101827] text-white overflow-hidden relative animate-fade-in">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h2 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-4">{t("home.workflow.tag")}</h2>
          <h3 className="text-3xl md:text-5xl font-black text-white leading-tight">
            {t("home.workflow.title")}
          </h3>
        </div>

        {/* Desktop View */}
        <div className="relative mt-20 hidden lg:block pb-10">
          {/* Continuous Horizontal Line */}
          <div className="absolute top-[32px] left-8 right-8 h-1 bg-emerald-600 rounded-full z-0 shadow-[0_0_15px_rgba(5,150,105,0.5)]"></div>

          <div className="grid grid-cols-8 gap-4 relative z-10">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className="relative mb-8">
                  {/* Icon Container */}
                  <div className="w-16 h-16 bg-[#1f2937] border-2 border-slate-700/50 rounded-2xl flex items-center justify-center relative z-10 group-hover:-translate-y-2 group-hover:border-emerald-500 group-hover:shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all duration-300">
                    <step.icon className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  
                  {/* Step Number Badge */}
                  <div className="absolute -top-3 -right-3 w-6 h-6 bg-emerald-500 text-slate-900 text-xs font-black rounded-full flex items-center justify-center shadow-lg z-20 group-hover:scale-110 transition-transform duration-300">
                    {idx + 1}
                  </div>
                </div>
                
                <h4 className="text-sm font-bold text-white mb-2 leading-tight group-hover:text-emerald-400 transition-colors duration-300">{step.title}</h4>
                <p className="text-[11px] font-medium text-slate-400 leading-relaxed max-w-[120px] mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile/Tablet View */}
        <div className="lg:hidden flex flex-col gap-10 mt-12 relative pl-2">
          {/* Continuous Vertical Line */}
          <div className="absolute top-4 bottom-12 left-[34px] w-1 bg-emerald-600 rounded-full z-0 shadow-[0_0_15px_rgba(5,150,105,0.5)]"></div>
          
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-6 relative z-10 group">
              <div className="relative shrink-0">
                  <div className="w-14 h-14 bg-[#1f2937] border-2 border-slate-700/50 rounded-2xl flex items-center justify-center relative z-10 group-hover:border-emerald-500 transition-colors duration-300">
                    <step.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center shadow-lg z-20">
                    {idx + 1}
                  </div>
              </div>
              <div className="pt-2">
                <h4 className="text-base font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors duration-300">{step.title}</h4>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
