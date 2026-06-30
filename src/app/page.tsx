"use client";

import dynamic from 'next/dynamic';
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "react-i18next";
import Footer from "@/components/Footer";

// Dynamic Imports for modular landing page sections
const LandingHero = dynamic(() => import('@/components/landing/LandingHero'));
const AboutUs = dynamic(() => import('@/components/landing/AboutUs'));
const WhyCommunityHero = dynamic(() => import('@/components/landing/WhyCommunityHero'));
const WorkflowTimeline = dynamic(() => import('@/components/landing/WorkflowTimeline'));
const UserEcosystem = dynamic(() => import('@/components/landing/UserEcosystem'));
const AIIntelligence = dynamic(() => import('@/components/landing/AIIntelligence'));
const TransparencyTrust = dynamic(() => import('@/components/landing/TransparencyTrust'));
const PlatformAnalytics = dynamic(() => import('@/components/landing/PlatformAnalytics'));
const CommunityFeedPreview = dynamic(() => import('@/components/landing/CommunityFeedPreview'));
const SecurityVerification = dynamic(() => import('@/components/landing/SecurityVerification'));
const TechStack = dynamic(() => import('@/components/landing/TechStack'));
const ImpactSection = dynamic(() => import('@/components/landing/ImpactSection'));
const OrganizationRegistrationCTA = dynamic(() => import('@/components/landing/OrganizationRegistrationCTA'));
const CoverageMap = dynamic(() => import('@/components/CoverageMap'), { ssr: false, loading: () => <div className="w-full h-[500px] flex items-center justify-center bg-slate-50 rounded-3xl animate-pulse text-green-600 font-bold">Loading Live Map...</div> });

export default function Home() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const { t } = useTranslation();

  const handleCTA = () => {
    if (loading) return;
    if (!user) router.push("/login");
    else if (role === "citizen") router.push("/report");
    else if (role === "super_admin") router.push("/super-admin");
    else if (role === "admin") router.push("/admin");
    else if (role === "employee") router.push("/employee");
  };

  return (
    <div className="min-h-screen font-sans overflow-x-hidden bg-white selection:bg-green-100 selection:text-green-900">
      <LandingHero />
      <AboutUs />
      <WorkflowTimeline />
      <UserEcosystem />
      
      {/* ─── LIVE COVERAGE MAP SECTION ─── */}
      <section className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-sm font-black text-green-600 uppercase tracking-widest mb-4">{t("home.coverage.tag")}</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-6">
              {t("home.coverage.title")}
            </h3>
            <p className="text-lg text-slate-600 font-medium leading-relaxed">
              {t("home.coverage.desc")}
            </p>
          </div>
          <CoverageMap />
        </div>
      </section>

      <OrganizationRegistrationCTA />

      <AIIntelligence />
      <WhyCommunityHero />
      <PlatformAnalytics />

      <Footer />
    </div>
  );
}
