"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function OrganizationRegistrationCTA() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-green-950 text-white border-y border-green-900 animate-fade-in">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left side - Intro & CTA */}
          <div>
            <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-4">{t("home.cta.tag")}</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
              {t("home.cta.title")}
            </h3>
            <p className="text-lg text-green-100/80 mb-10 max-w-xl leading-relaxed font-medium">
              {t("home.cta.desc")}
            </p>
            <button 
              onClick={() => router.push("/volunteer-org/register")}
              className="bg-green-500 hover:bg-green-400 text-green-950 font-bold px-8 py-4 rounded-lg shadow-sm transition-colors flex items-center gap-3 group text-lg"
            >
              {t("home.cta.registerButton")}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Right side - 3 Steps List */}
          <div className="space-y-8 lg:pl-10 lg:border-l lg:border-green-800/50">
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 rounded-full border-2 border-green-700 bg-green-900/50 flex items-center justify-center text-green-400 font-black text-xl">
                1
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">{t("home.cta.step1Title")}</h4>
                <p className="text-green-100/70 leading-relaxed">{t("home.cta.step1Desc")}</p>
              </div>
            </div>
            
            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 rounded-full border-2 border-green-700 bg-green-900/50 flex items-center justify-center text-green-400 font-black text-xl">
                2
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">{t("home.cta.step2Title")}</h4>
                <p className="text-green-100/70 leading-relaxed">{t("home.cta.step2Desc")}</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="shrink-0 w-12 h-12 rounded-full border-2 border-green-700 bg-green-900/50 flex items-center justify-center text-green-400 font-black text-xl">
                3
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">{t("home.cta.step3Title")}</h4>
                <p className="text-green-100/70 leading-relaxed">{t("home.cta.step3Desc")}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
