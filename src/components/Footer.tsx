import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleCTA = () => {
    // Basic handler since we don't have auth context easily here without props, 
    // or we can import useAuth. Let's just navigate to dashboard for now or community.
    router.push("/dashboard");
  };

  return (
    <footer className="bg-green-950 text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-green-900 mt-auto animate-fade-in">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-400 rounded-xl flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-2xl tracking-tight text-white">{t("common.title")}</span>
          </div>
          <p className="text-green-200/80 text-sm max-w-sm font-medium mb-8 leading-relaxed">
            {t("footer.desc")}
          </p>
        </div>
        
        <div>
          <h4 className="font-black text-white mb-6 text-sm tracking-widest uppercase">{t("footer.platform")}</h4>
          <ul className="space-y-4">
            <li><button onClick={() => router.push("/community")} className="text-green-300 hover:text-white transition-colors text-sm font-medium">{t("footer.liveFeed")}</button></li>
            <li><button onClick={() => router.push("/report")} className="text-green-300 hover:text-white transition-colors text-sm font-medium">{t("footer.reportIssue")}</button></li>
            <li><button onClick={() => router.push("/login")} className="text-green-300 hover:text-white transition-colors text-sm font-medium">{t("footer.dashboards")}</button></li>
          </ul>
        </div>

        <div>
          <h4 className="font-black text-white mb-6 text-sm tracking-widest uppercase">{t("footer.ecosystem")}</h4>
          <ul className="space-y-4">
            <li className="text-green-300 text-sm font-medium">{t("footer.citizens")}</li>
            <li className="text-green-300 text-sm font-medium">{t("footer.workers")}</li>
            <li className="text-green-300 text-sm font-medium">{t("footer.admins")}</li>
            <li className="text-green-300 text-sm font-medium">{t("footer.superAdmins")}</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-black text-white mb-6 text-sm tracking-widest uppercase">Integrations</h4>
          <ul className="space-y-4">
            <li><button onClick={() => router.push("/super-admin/settings/integrations")} className="text-green-300 hover:text-white transition-colors text-sm font-medium">CRM Webhooks</button></li>
            <li className="text-green-300 text-sm font-medium">Pub/Sub Events</li>
            <li className="text-green-300 text-sm font-medium">API Documentation</li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-[1400px] mx-auto mt-16 pt-8 border-t border-green-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-green-500 text-sm font-medium">
          {t("footer.copy", { year: new Date().getFullYear() })}
        </p>
        <div className="flex gap-4 text-green-500 font-bold text-sm">
          {t("footer.badges")}
        </div>
      </div>
    </footer>
  );
}
