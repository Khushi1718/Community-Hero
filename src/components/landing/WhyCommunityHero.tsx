"use client";

import { useTranslation } from "react-i18next";
import { motion, Variants } from "framer-motion";

export default function WhyCommunityHero() {
  const { t } = useTranslation();

  const features = [
    {
      title: t("home.why.features.ai.title"),
      desc: t("home.why.features.ai.desc"),
      image: "/images/ai.png"
    },
    {
      title: t("home.why.features.accountability.title"),
      desc: t("home.why.features.accountability.desc"),
      image: "/images/verified.png"
    },
    {
      title: t("home.why.features.audit.title"),
      desc: t("home.why.features.audit.desc"),
      image: "/images/audit.png"
    },
    {
      title: t("home.why.features.privacy.title"),
      desc: t("home.why.features.privacy.desc"),
      image: "/images/routing.png"
    }
  ];

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.3 // Obvious stagger timing so cards load one by one
      }
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    },
    hover: {
      y: -8,
      scale: 1.02,
      backgroundColor: "#f0fdf4", // bg-green-50 on hover
      borderColor: "#86efac", // border-green-300 on hover
      boxShadow: "0 20px 25px -5px rgba(22, 163, 74, 0.05), 0 8px 10px -6px rgba(22, 163, 74, 0.03)",
      transition: { duration: 0.3, ease: "easeOut" as const }
    }
  };

  return (
    <section className="py-24 bg-white border-y border-slate-200 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-sm font-black text-blue-700 uppercase tracking-widest mb-4">{t("home.why.tag")}</h2>
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-6">
            {t("home.why.title")}
          </h3>
          <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-3xl mx-auto">
            {t("home.why.desc")}
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="flex overflow-x-auto snap-x snap-mandatory pb-6 -mx-4 px-4 md:-mx-0 md:px-0 md:pb-0 md:grid sm:grid-cols-2 lg:grid-cols-4 gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {features.map((feature, idx) => (
            <motion.div 
              key={idx} 
              variants={cardVariants}
              whileHover="hover"
              className="w-[85vw] shrink-0 snap-center md:w-auto group bg-[#f4fbf7] border border-green-100 rounded-2xl p-5 shadow-sm flex flex-col h-full cursor-default"
            >
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
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
