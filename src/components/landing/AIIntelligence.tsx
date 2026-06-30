"use client";

import { Scan, Cpu, Crosshair, Binary, Map, Mail, Cloud, Award, Server } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, Variants } from "framer-motion";

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

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 25 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const }
    },
    hover: {
      y: -5,
      scale: 1.015,
      borderColor: "#a7f3d0", // Green border on hover
      boxShadow: "0 15px 20px -5px rgba(16, 185, 129, 0.04), 0 6px 8px -6px rgba(16, 185, 129, 0.02)",
      transition: { duration: 0.3, ease: "easeOut" as const }
    }
  };

  const iconVariants: Variants = {
    hover: { 
      scale: 1.1,
      backgroundColor: "#d1e7dd", // Light emerald bg on hover
      color: "#0f5132", // Deep green text on hover
      borderColor: "#badbcc",
      transition: { duration: 0.3 }
    }
  };

  const textVariants: Variants = {
    hover: {
      color: "#065f46", // Emerald-800 text on hover
      transition: { duration: 0.3 }
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50/30 to-white border-y border-slate-200 relative overflow-hidden">
      {/* Subtle Dot Grid Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
        style={{ 
          backgroundImage: "radial-gradient(#059669 1px, transparent 1px)", // Emerald colored dot grid
          backgroundSize: "24px 24px" 
        }} 
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold tracking-widest uppercase mb-6"
          >
            <Server className="w-4 h-4" /> {t("home.infrastructure.tag")}
          </motion.div>
          <motion.h3 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
            className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-6"
          >
            {t("home.infrastructure.title")}
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
            className="text-slate-600 font-medium text-lg leading-relaxed"
          >
            {t("home.infrastructure.desc")}
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="flex overflow-x-auto snap-x snap-mandatory pb-6 -mx-4 px-4 md:-mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {features.map((feature, idx) => (
            <motion.div 
              key={idx} 
              variants={cardVariants}
              whileHover="hover"
              className="w-[85vw] shrink-0 snap-center md:w-auto p-6 rounded-2xl bg-emerald-50/10 border border-emerald-100/50 shadow-sm transition-all duration-300 cursor-default"
            >
              <motion.div 
                variants={iconVariants}
                className="w-10 h-10 rounded-xl bg-white border border-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-xs transition-colors"
              >
                <feature.icon className="w-5 h-5 stroke-[2]" />
              </motion.div>
              <motion.h4 
                variants={textVariants}
                className="text-base font-bold text-slate-900 mb-2"
              >
                {feature.title}
              </motion.h4>
              <p className="text-xs font-medium text-slate-600 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
