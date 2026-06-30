"use client";

import { Edit, Users, Megaphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { motion, Variants } from "framer-motion";

export default function LandingHero() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const { t } = useTranslation();

  const handleReport = () => {
    if (loading) return;
    if (!user) router.push("/login");
    else if (role === "citizen") router.push("/report");
    else if (role === "super_admin") router.push("/super-admin");
    else if (role === "admin") router.push("/admin");
    else if (role === "employee") router.push("/employee");
  };

  const handleJoinDrive = () => {
    router.push("/community"); 
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      }
    }
  };

  const itemLeftVariants: Variants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const barVariants: Variants = {
    hidden: { opacity: 0, scaleX: 0 },
    visible: {
      opacity: 1,
      scaleX: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <>
      <section className="relative min-h-[420px] lg:min-h-[500px] flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/heroo.png"
            alt="Hero Background"
            fill
            className="object-cover object-center"
            priority
          />
        </div>
        <div className="absolute inset-0 z-0 bg-black/60" /> {/* Dark overlay for text readability */}

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-14 pb-14">
          {/* Left Content */}
          <motion.div
            className="max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.h1
              variants={itemLeftVariants}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-4"
            >
              {t("home.hero.title")}
            </motion.h1>
            
            <motion.div
              variants={barVariants}
              className="w-full max-w-[640px] h-1 bg-[#2e7d32] mb-8 rounded-full origin-left"
            />
            
            <motion.p
              variants={itemLeftVariants}
              className="text-xl md:text-2xl text-gray-200 mb-10 leading-relaxed max-w-2xl font-medium"
            >
              {t("home.hero.subtitle")}
            </motion.p>

            <motion.div
              variants={itemLeftVariants}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <button 
                onClick={handleReport} 
                className="w-full sm:w-auto bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-medium text-lg px-8 py-3 rounded-md transition-all duration-300 hover:scale-[1.03] shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit className="w-5 h-5" />
                {t("home.hero.reportButton")}
              </button>
              <button 
                onClick={handleJoinDrive} 
                className="w-full sm:w-auto bg-transparent border border-white hover:bg-white/10 text-white font-medium text-lg px-8 py-3 rounded-md transition-all duration-300 hover:scale-[1.03] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users className="w-5 h-5" />
                {t("home.hero.joinDriveButton")}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Latest Announcement Banner */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-[#2e7d32] font-bold whitespace-nowrap">
            <Megaphone className="w-5 h-5" />
            {t("home.announcement.label")}
          </div>
          <p className="text-gray-700 font-medium text-center sm:text-left">
            {t("home.announcement.text")}
          </p>
          <button onClick={() => router.push("/community")} className="text-blue-600 hover:text-blue-800 font-semibold underline whitespace-nowrap cursor-pointer">
            {t("home.announcement.knowMore")}
          </button>
        </div>
      </div>
    </>
  );
}
