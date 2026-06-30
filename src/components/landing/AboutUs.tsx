"use client";

import { ClipboardCheck, Users, Award, BarChart2, Users2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, Variants } from "framer-motion";

export default function AboutUs() {
  const { t } = useTranslation();

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    },
    hover: {
      y: -8,
      transition: { duration: 0.3, ease: "easeOut" as const }
    }
  };

  const iconVariants: Variants = {
    hover: { 
      scale: 1.12,
      backgroundColor: "#d1e7dd",
      transition: { duration: 0.3 }
    }
  };

  return (
    <section className="bg-white border-b border-slate-200 font-sans overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        {/* Top Section: Text and Image */}
        <div className="flex flex-col lg:flex-row min-h-[500px]">
          {/* Left Text */}
          <motion.div 
            className="flex-1 px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col justify-center"
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" as const }}
          >
            <h2 className="text-4xl font-bold text-[#0f172a] mb-3">{t("home.about.title")}</h2>
            <h3 className="text-[#2e7d32] font-semibold text-lg mb-8">
              {t("home.about.subtitle")}
            </h3>
            
            <p className="text-[#334155] text-base leading-relaxed mb-6 font-medium">
              {t("home.about.desc1")}
            </p>
            
            <p className="text-[#334155] text-base leading-relaxed font-medium">
              {t("home.about.desc2")}
            </p>
          </motion.div>
          
          {/* Right Image */}
          <motion.div 
            className="flex-1 relative hidden lg:block overflow-hidden min-h-[400px]"
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" as const, delay: 0.15 }}
          >
            <div 
               className="absolute inset-0 bg-cover bg-center"
               style={{ 
                 backgroundImage: "url('/images/hero-bg.png')",
                 clipPath: "url(#smooth-curve)"
               }} 
            />
            {/* Smooth curve border outline */}
            <svg 
              className="absolute inset-y-0 left-0 w-full h-full pointer-events-none" 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none"
            >
              <path 
                d="M 15,0 C 32,25 32,75 15,100" 
                fill="none" 
                stroke="#2e7d32" 
                strokeWidth="2" 
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <svg className="absolute w-0 h-0" width="0" height="0">
              <defs>
                <clipPath id="smooth-curve" clipPathUnits="objectBoundingBox">
                  <path d="M 0.15,0 C 0.32,0.25 0.32,0.75 0.15,1 L 1,1 L 1,0 Z" />
                </clipPath>
              </defs>
            </svg>
          </motion.div>
        </div>
      </div>
      
      {/* 5 Columns Feature Section */}
      <div className="border-t border-slate-100 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="flex overflow-x-auto snap-x snap-mandatory pb-6 -mx-4 px-4 md:-mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {/* Citizen */}
            <motion.div 
              variants={cardVariants}
              whileHover="hover"
              className="flex flex-col h-full w-[85vw] shrink-0 snap-center md:w-auto p-6 rounded-2xl border border-slate-100 bg-slate-50/50 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/[0.03] hover:border-emerald-200"
            >
              <motion.div 
                variants={iconVariants}
                className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[#2e7d32] mb-4 border border-green-100 shrink-0 transition-colors"
              >
                <ClipboardCheck className="w-6 h-6" />
              </motion.div>
              <h4 className="font-bold text-[#0f172a] text-lg mb-3 shrink-0">{t("home.about.roles.citizen.title")}</h4>
              <p className="text-[#475569] text-sm leading-relaxed font-medium flex-grow">
                {t("home.about.roles.citizen.desc")}
              </p>
            </motion.div>
            
            {/* Community */}
            <motion.div 
              variants={cardVariants}
              whileHover="hover"
              className="flex flex-col h-full w-[85vw] shrink-0 snap-center md:w-auto p-6 rounded-2xl border border-slate-100 bg-slate-50/50 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/[0.03] hover:border-emerald-200"
            >
              <motion.div 
                variants={iconVariants}
                className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[#2e7d32] mb-4 border border-green-100 shrink-0 transition-colors"
              >
                <Users className="w-6 h-6" />
              </motion.div>
              <h4 className="font-bold text-[#0f172a] text-lg mb-3 shrink-0">{t("home.about.roles.community.title")}</h4>
              <p className="text-[#475569] text-sm leading-relaxed font-medium flex-grow">
                {t("home.about.roles.community.desc")}
              </p>
            </motion.div>
            
            {/* Employee */}
            <motion.div 
              variants={cardVariants}
              whileHover="hover"
              className="flex flex-col h-full w-[85vw] shrink-0 snap-center md:w-auto p-6 rounded-2xl border border-slate-100 bg-slate-50/50 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/[0.03] hover:border-emerald-200"
            >
              <motion.div 
                variants={iconVariants}
                className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[#2e7d32] mb-4 border border-green-100 shrink-0 transition-colors"
              >
                <Award className="w-6 h-6" />
              </motion.div>
              <h4 className="font-bold text-[#0f172a] text-lg mb-3 shrink-0">{t("home.about.roles.employee.title")}</h4>
              <p className="text-[#475569] text-sm leading-relaxed font-medium flex-grow">
                {t("home.about.roles.employee.desc")}
              </p>
            </motion.div>
 
            {/* Admin */}
            <motion.div 
              variants={cardVariants}
              whileHover="hover"
              className="flex flex-col h-full w-[85vw] shrink-0 snap-center md:w-auto p-6 rounded-2xl border border-slate-100 bg-slate-50/50 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/[0.03] hover:border-emerald-200"
            >
              <motion.div 
                variants={iconVariants}
                className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[#2e7d32] mb-4 border border-green-100 shrink-0 transition-colors"
              >
                <BarChart2 className="w-6 h-6" />
              </motion.div>
              <h4 className="font-bold text-[#0f172a] text-lg mb-3 shrink-0">{t("home.about.roles.admin.title")}</h4>
              <p className="text-[#475569] text-sm leading-relaxed font-medium flex-grow">
                {t("home.about.roles.admin.desc")}
              </p>
            </motion.div>
            
            {/* Superadmin */}
            <motion.div 
              variants={cardVariants}
              whileHover="hover"
              className="flex flex-col h-full w-[85vw] shrink-0 snap-center md:w-auto p-6 rounded-2xl border border-slate-100 bg-slate-50/50 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/[0.03] hover:border-emerald-200"
            >
              <motion.div 
                variants={iconVariants}
                className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[#2e7d32] mb-4 border border-green-100 shrink-0 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </motion.div>
              <h4 className="font-bold text-[#0f172a] text-lg mb-3 shrink-0">{t("home.about.roles.superadmin.title")}</h4>
              <p className="text-[#475569] text-sm leading-relaxed font-medium flex-grow">
                {t("home.about.roles.superadmin.desc")}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Bottom CTA Bar */}
      <div className="border-t border-slate-200 bg-white py-12 shadow-[inset_0_10px_30px_-15px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-center gap-6">
          <div className="text-[#1b5e20] flex items-center justify-center">
            <Users2 className="w-12 h-12" />
          </div>
          
          <div className="hidden md:block w-[1px] h-12 bg-slate-300"></div>
          
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-[#1b5e20] mb-1">
              {t("home.about.cta.title")}
            </h3>
            <p className="text-slate-500 font-medium text-base">
              {t("home.about.cta.subtitle")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
