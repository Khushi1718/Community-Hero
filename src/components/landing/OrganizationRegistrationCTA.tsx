"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, Variants } from "framer-motion";

export default function OrganizationRegistrationCTA() {
  const router = useRouter();
  const { t } = useTranslation();

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.25
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  return (
    <section className="py-20 bg-green-950 text-white border-y border-green-900 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left side - Intro & CTA */}
          <motion.div
            initial={{ opacity: 0, x: -45 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" as const }}
          >
            <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-4">{t("home.cta.tag")}</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
              {t("home.cta.title")}
            </h3>
            <p className="text-lg text-green-100/80 mb-10 max-w-xl leading-relaxed font-medium">
              {t("home.cta.desc")}
            </p>
            <button 
              onClick={() => router.push("/volunteer-org/register")}
              className="bg-green-500 hover:bg-green-400 text-green-950 font-bold px-8 py-4 rounded-lg shadow-sm transition-all duration-300 hover:scale-[1.03] flex items-center gap-3 group text-lg cursor-pointer"
            >
              {t("home.cta.registerButton")}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Right side - 3 Steps List */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-8 lg:pl-10 lg:border-l lg:border-green-800/50"
          >
            <motion.div variants={itemVariants} className="flex gap-6">
              <div className="shrink-0 w-12 h-12 rounded-full border-2 border-green-700 bg-green-900/50 flex items-center justify-center text-green-400 font-black text-xl">
                1
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">{t("home.cta.step1Title")}</h4>
                <p className="text-green-100/70 leading-relaxed">{t("home.cta.step1Desc")}</p>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="flex gap-6">
              <div className="shrink-0 w-12 h-12 rounded-full border-2 border-green-700 bg-green-900/50 flex items-center justify-center text-green-400 font-black text-xl">
                2
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">{t("home.cta.step2Title")}</h4>
                <p className="text-green-100/70 leading-relaxed">{t("home.cta.step2Desc")}</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex gap-6">
              <div className="shrink-0 w-12 h-12 rounded-full border-2 border-green-700 bg-green-900/50 flex items-center justify-center text-green-400 font-black text-xl">
                3
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">{t("home.cta.step3Title")}</h4>
                <p className="text-green-100/70 leading-relaxed">{t("home.cta.step3Desc")}</p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
