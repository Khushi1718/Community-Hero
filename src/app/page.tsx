"use client";

import dynamic from 'next/dynamic';
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

// Dynamic Imports for modular landing page sections
const LandingHero = dynamic(() => import('@/components/landing/LandingHero'));
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
      <WhyCommunityHero />
      <WorkflowTimeline />
      <UserEcosystem />
      <AIIntelligence />
      <TransparencyTrust />
      
      {/* ─── LIVE COVERAGE MAP SECTION ─── */}
      <section className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-sm font-black text-green-600 uppercase tracking-widest mb-4">National Scale</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-6">
              Live Network Coverage.
            </h3>
            <p className="text-lg text-slate-600 font-medium leading-relaxed">
              Our ecosystem scales organically. Below is the live footprint of active municipal administrators operating on Community Hero.
            </p>
          </div>
          <CoverageMap />
        </div>
      </section>

      <PlatformAnalytics />
      <OrganizationRegistrationCTA />
      <CommunityFeedPreview />
      <SecurityVerification />
      <TechStack />
      <ImpactSection />

      {/* ─── FOOTER ─── */}
      <footer className="bg-green-950 text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-green-900">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-400 rounded-xl flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-2xl tracking-tight text-white">Community Hero</span>
            </div>
            <p className="text-green-200/80 text-sm max-w-sm font-medium mb-8 leading-relaxed">
              An AI-powered civic governance platform built for hackathon excellence. Connecting citizens and municipalities through transparent, actionable data.
            </p>
          </div>
          
          <div>
            <h4 className="font-black text-white mb-6 text-sm tracking-widest uppercase">Platform</h4>
            <ul className="space-y-4">
              <li><button onClick={() => router.push("/community")} className="text-green-300 hover:text-white transition-colors text-sm font-medium">Live Feed</button></li>
              <li><button onClick={() => router.push("/report")} className="text-green-300 hover:text-white transition-colors text-sm font-medium">Report Issue</button></li>
              <li><button onClick={handleCTA} className="text-green-300 hover:text-white transition-colors text-sm font-medium">Dashboards</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-white mb-6 text-sm tracking-widest uppercase">Ecosystem</h4>
            <ul className="space-y-4">
              <li className="text-green-300 text-sm font-medium">Citizens</li>
              <li className="text-green-300 text-sm font-medium">Municipal Workers</li>
              <li className="text-green-300 text-sm font-medium">City Admins</li>
              <li className="text-green-300 text-sm font-medium">Super Admins</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-black text-white mb-6 text-sm tracking-widest uppercase">Hackathon</h4>
            <ul className="space-y-4">
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="text-green-300 hover:text-white transition-colors text-sm font-medium">GitHub Repo</a></li>
              <li className="text-green-300 text-sm font-medium">Documentation</li>
              <li className="text-green-300 text-sm font-medium">Developer Team</li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-[1400px] mx-auto mt-16 pt-8 border-t border-green-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-green-500 text-sm font-medium">
            &copy; {new Date().getFullYear()} Community Hero Ecosystem. Open Innovation.
          </p>
          <div className="flex gap-4 text-green-500 font-bold text-sm">
            AI-POWERED • GPS-VERIFIED • PUBLICLY-ACCOUNTABLE
          </div>
        </div>
      </footer>

    </div>
  );
}
