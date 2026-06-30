"use client";

import { SignIn, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { ShieldAlert, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { setDevBypass } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [error, setError] = useState("");

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
        // Use the secure server-side login endpoint — password never exposed to client
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: staffEmail.trim(), password: staffPassword })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || "Login failed. Please try again.");
          return;
        }

        const user = data.user;
        setDevBypass(staffEmail.trim());
        setTimeout(() => {
          if (user.role === "super_admin") router.push("/super-admin");
          else if (user.role === "admin") router.push("/admin");
          else if (user.role === "employee") router.push("/employee");
          else if (user.role === "volunteer_org") router.push("/volunteer-org/dashboard");
          else router.push("/");
        }, 100);
    } catch (err) {
        console.error(err);
        setError("Failed to connect to authentication server.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-70px)] flex items-center justify-center p-4 font-sans relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/new_hero_bg.png"
          alt="Login Background"
          fill
          className="object-cover object-center"
          priority
        />
      </div>
      
      {/* Black Blur Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md z-0" />

      {/* Force hide Clerk footer and branding to prevent scrolling */}
      <style dangerouslySetInnerHTML={{__html: `
        .cl-footerAction, .cl-internal-b3al6g, .cl-footer { display: none !important; }
      `}} />

      <div className="max-w-[1000px] w-full bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col md:flex-row overflow-hidden border border-green-100 z-10">
        
        {/* Left side: Citizen */}
        <div className="w-full md:w-1/2 flex flex-col p-6 lg:p-10 border-r border-slate-100 bg-white relative">
           <div className="w-full max-w-[340px] mx-auto">
              <div className="mb-4 text-center md:text-left">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t("login.title")}</h2>
                 <p className="text-slate-500 text-[13px] mt-1">{t("login.subtitle")}</p>
              </div>
              
              <div className="rounded-xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 bg-white flex justify-center mb-4 relative z-20 min-h-[400px]">
                 <ClerkLoading>
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 z-30">
                     <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-4" />
                     <p className="text-sm text-slate-500 font-medium">{t("login.loading")}</p>
                   </div>
                 </ClerkLoading>
                 <ClerkLoaded>
                   <SignIn routing="hash" appearance={{ elements: { footer: "hidden" } }} />
                 </ClerkLoaded>
              </div>

              <div className="bg-green-50/80 border border-green-100 rounded-lg p-3">
                 <p className="text-[11px] text-green-700 font-medium leading-tight flex items-start gap-2">
                   <ShieldAlert className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                   <span>{t("login.judgeWarning")}</span>
                 </p>
              </div>
           </div>
        </div>

        {/* Right side: Staff & Partners */}
        <div className="w-full md:w-1/2 flex flex-col p-6 lg:p-10 bg-[#FAFCFB] relative">
           <div className="w-full max-w-[340px] mx-auto">
              <div className="mb-4 text-center md:text-left">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center md:justify-start gap-2">
                    <KeyRound className="w-5 h-5 text-green-600" />
                    {t("login.partner.title")}
                 </h2>
                 <p className="text-slate-500 text-[13px] mt-1">{t("login.partner.subtitle")}</p>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] mb-4">
                 <form onSubmit={handleStaffLogin} className="space-y-4">
                     {error && (
                         <div className="bg-red-50 text-red-700 text-[11px] font-bold p-2.5 rounded-lg flex items-start gap-2 border border-red-100">
                             <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" /> 
                             <span className="leading-tight">{error}</span>
                         </div>
                     )}
                     <div>
                         <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">{t("login.partner.emailLabel")}</label>
                         <input 
                             type="email" 
                             required 
                             value={staffEmail} 
                             onChange={e => setStaffEmail(e.target.value)} 
                             className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-[13px] focus:ring-2 focus:ring-green-500/20 focus:outline-none focus:border-green-600 transition-colors bg-slate-50 hover:bg-white"
                             placeholder={t("login.partner.emailPlaceholder")}
                         />
                     </div>
                     <div>
                         <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">{t("login.partner.passwordLabel")}</label>
                         <input 
                             type="password" 
                             required 
                             value={staffPassword} 
                             onChange={e => setStaffPassword(e.target.value)} 
                             className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-[13px] focus:ring-2 focus:ring-green-500/20 focus:outline-none focus:border-green-600 transition-colors bg-slate-50 hover:bg-white"
                             placeholder={t("login.partner.passwordPlaceholder")}
                         />
                     </div>
                     <button type="submit" className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold text-[13px] py-2.5 rounded-lg transition-all mt-1 shadow-sm">
                         {t("login.partner.submit")}
                     </button>
                 </form>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                 <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">{t("login.partner.demoCreds")}</h4>
                 <div className="grid grid-cols-2 gap-1.5">
                    <button type="button" onClick={() => { setStaffEmail('superadmin@google.com'); setStaffPassword('password123'); }} className="text-left bg-slate-50 border border-slate-100 p-2 rounded-lg hover:border-green-300 hover:bg-green-50/50 transition-all group">
                       <span className="font-bold text-slate-800 text-[11px] block group-hover:text-green-700">{t("login.partner.superAdmin")}</span>
                       <span className="text-slate-400 text-[9px] truncate block">superadmin@...</span>
                    </button>
                    <button type="button" onClick={() => { setStaffEmail('vansh123@google.com'); setStaffPassword('vansh123'); }} className="text-left bg-slate-50 border border-slate-100 p-2 rounded-lg hover:border-green-300 hover:bg-green-50/50 transition-all group">
                       <span className="font-bold text-slate-800 text-[11px] block group-hover:text-green-700">{t("login.partner.cityAdmin")}</span>
                       <span className="text-slate-400 text-[9px] truncate block">vansh123@...</span>
                    </button>
                    <button type="button" onClick={() => { setStaffEmail('greenwarriorsjind@gmail.com'); setStaffPassword('greenwarriors'); }} className="text-left bg-slate-50 border border-slate-100 p-2 rounded-lg hover:border-green-300 hover:bg-green-50/50 transition-all group">
                       <span className="font-bold text-slate-800 text-[11px] block group-hover:text-green-700">{t("login.partner.org")}</span>
                       <span className="text-slate-400 text-[9px] truncate block">greenwarriors...</span>
                    </button>
                    <button type="button" onClick={() => { setStaffEmail('vansh1@gmail.com'); setStaffPassword('vansh1'); }} className="text-left bg-slate-50 border border-slate-100 p-2 rounded-lg hover:border-green-300 hover:bg-green-50/50 transition-all group">
                       <span className="font-bold text-slate-800 text-[11px] block group-hover:text-green-700">{t("login.partner.employee")}</span>
                       <span className="text-slate-400 text-[9px] truncate block">vansh1@...</span>
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
