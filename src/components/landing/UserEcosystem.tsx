"use client";

import { UserCircle, Wrench, Shield, Globe, Building, ArrowRight, Bell, Cloud, HeartHandshake } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, Variants } from "framer-motion";

export default function UserEcosystem() {
  const { t } = useTranslation();

  const roles = [
    {
      icon: UserCircle,
      title: t("home.ecosystem.roles.citizen.title"),
      items: [
        t("home.ecosystem.roles.citizen.item1"),
        t("home.ecosystem.roles.citizen.item2"),
        t("home.ecosystem.roles.citizen.item3"),
        t("home.ecosystem.roles.citizen.item4")
      ]
    },
    {
      icon: Wrench,
      title: t("home.ecosystem.roles.employee.title"),
      items: [
        t("home.ecosystem.roles.employee.item1"),
        t("home.ecosystem.roles.employee.item2"),
        t("home.ecosystem.roles.employee.item3"),
        t("home.ecosystem.roles.employee.item4")
      ]
    },
    {
      icon: Shield,
      title: t("home.ecosystem.roles.admin.title"),
      items: [
        t("home.ecosystem.roles.admin.item1"),
        t("home.ecosystem.roles.admin.item2"),
        t("home.ecosystem.roles.admin.item3"),
        t("home.ecosystem.roles.admin.item4")
      ]
    },
    {
      icon: Globe,
      title: t("home.ecosystem.roles.superadmin.title"),
      items: [
        t("home.ecosystem.roles.superadmin.item1"),
        t("home.ecosystem.roles.superadmin.item2"),
        t("home.ecosystem.roles.superadmin.item3"),
        t("home.ecosystem.roles.superadmin.item4")
      ]
    },
    {
      icon: HeartHandshake,
      title: t("home.ecosystem.roles.partner.title"),
      items: [
        t("home.ecosystem.roles.partner.item1"),
        t("home.ecosystem.roles.partner.item2"),
        t("home.ecosystem.roles.partner.item3"),
        t("home.ecosystem.roles.partner.item4")
      ]
    }
  ];

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12
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
      scale: 1.015,
      boxShadow: "0 25px 35px -12px rgba(16, 185, 129, 0.08)",
      borderColor: "#a7f3d0",
      transition: { duration: 0.3, ease: "easeOut" as const }
    }
  };

  const iconVariants: Variants = {
    hover: { 
      scale: 1.15,
      backgroundColor: "#d1e7dd",
      color: "#0f5132",
      borderColor: "#badbcc",
      transition: { duration: 0.3 }
    }
  };

  const integrationsContainerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.35
      }
    }
  };

  const integrationNodeVariants: Variants = {
    hidden: { opacity: 0, y: 25, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  const arrowVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8, x: -15 },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeOut" as const }
    }
  };

  return (
    <section className="py-12 bg-slate-50 border-b border-slate-200 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">{t("home.ecosystem.tag")}</h2>
          <h3 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
            {t("home.ecosystem.title")}
          </h3>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="flex overflow-x-auto snap-x snap-mandatory pb-6 -mx-4 px-4 md:-mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {roles.map((role, idx) => (
            <motion.div 
              key={idx} 
              variants={cardVariants}
              whileHover="hover"
              className="w-[85vw] shrink-0 snap-center md:w-auto rounded-xl p-7 border border-green-200 bg-white shadow-lg transition-all duration-300 shadow-green-500/5 cursor-default"
            >
              <div className="flex items-center gap-4 mb-5">
                <motion.div 
                  variants={iconVariants}
                  className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-green-50 text-green-600 border border-green-100 transition-colors"
                >
                  <role.icon className="w-6 h-6 stroke-[2.5]" />
                </motion.div>
                <h4 className="text-xl font-extrabold text-slate-900">{role.title}</h4>
              </div>
              
              <div className="w-10 h-[3px] rounded-full mb-6 bg-green-500" />
              
              <ul className="space-y-4">
                {role.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-green-500" />
                    <span className="text-sm font-medium text-slate-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Integrations Banner */}
        <div className="mt-16 bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="lg:w-1/3">
            <h4 className="text-xl font-bold text-slate-900 mb-3">{t("home.ecosystem.integration.title")}</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("home.ecosystem.integration.desc")}
            </p>
          </div>
          
          <motion.div 
            variants={integrationsContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="lg:w-2/3 flex items-center justify-between w-full gap-2 overflow-x-auto pb-4 lg:pb-0"
          >
            {/* Flow diagram */}
            <motion.div variants={integrationNodeVariants} className="flex flex-col items-center gap-3 min-w-[100px]">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                <Building className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-slate-700 text-center">{t("home.ecosystem.integration.crm")}</span>
            </motion.div>
            
            <motion.div variants={arrowVariants}>
              <ArrowRight className="w-5 h-5 text-slate-300 shrink-0" />
            </motion.div>
            
            {/* Normal Google Cloud Pub/Sub Node */}
            <motion.div variants={integrationNodeVariants} className="flex flex-col items-center gap-3 min-w-[100px]">
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                <Cloud className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-slate-700 text-center">{t("home.ecosystem.integration.pubsub")}</span>
            </motion.div>

            <motion.div variants={arrowVariants}>
              <ArrowRight className="w-5 h-5 text-slate-300 shrink-0" />
            </motion.div>

            <motion.div variants={integrationNodeVariants} className="flex flex-col items-center gap-3 min-w-[100px]">
              <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shadow-sm">
                <Shield className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-slate-700 text-center">{t("home.ecosystem.integration.platform")}</span>
            </motion.div>

            <motion.div variants={arrowVariants}>
              <ArrowRight className="w-5 h-5 text-slate-300 shrink-0" />
            </motion.div>

            <motion.div variants={integrationNodeVariants} className="flex flex-col items-center gap-3 min-w-[100px]">
              <div className="w-16 h-16 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                <Bell className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-slate-700 text-center">{t("home.ecosystem.integration.sync")}</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
