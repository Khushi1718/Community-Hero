import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Footer() {
  const router = useRouter();

  const handleCTA = () => {
    // Basic handler since we don't have auth context easily here without props, 
    // or we can import useAuth. Let's just navigate to dashboard for now or community.
    router.push("/dashboard");
  };

  return (
    <footer className="bg-green-950 text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-green-900 mt-auto">
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
            <li><button onClick={() => router.push("/login")} className="text-green-300 hover:text-white transition-colors text-sm font-medium">Dashboards</button></li>
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
  );
}
