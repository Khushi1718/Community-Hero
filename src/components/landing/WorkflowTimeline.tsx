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
    <section className="py-24 bg-slate-900 text-white overflow-hidden relative animate-fade-in">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h2 className="text-sm font-black text-green-400 uppercase tracking-widest mb-4">{t("home.workflow.tag")}</h2>
          <h3 className="text-3xl md:text-5xl font-black text-white leading-tight">
            {t("home.workflow.title")}
          </h3>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-12 left-10 right-10 h-1 bg-slate-800 rounded-full z-0">
             <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full w-full opacity-50 animate-pulse"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 lg:gap-0 relative z-10">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-4 group-hover:border-green-400 group-hover:bg-slate-700 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_0_20px_rgba(74,222,128,0.3)] z-10 relative">
                  <step.icon className="w-7 h-7 text-green-400" />
                  
                  {/* Step Number Badge */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 text-slate-900 rounded-full text-xs font-black flex items-center justify-center shadow-lg">
                    {idx + 1}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white mb-2 px-2">{step.title}</h4>
                <p className="text-xs font-medium text-slate-400 px-2 lg:px-4">{step.desc}</p>
                
                {/* Mobile Connector */}
                {idx < steps.length - 1 && (
                  <div className="lg:hidden h-8 w-px bg-slate-800 my-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
