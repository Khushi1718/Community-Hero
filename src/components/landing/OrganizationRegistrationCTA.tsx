import { Building2, ArrowRight, ShieldCheck, HeartHandshake, Globe2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OrganizationRegistrationCTA() {
  const router = useRouter();

  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50 border-t border-slate-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-indigo-900 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-teal-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center p-12 md:p-20">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-800/50 text-indigo-200 text-sm font-bold mb-6 border border-indigo-700/50">
                <Building2 className="w-4 h-4" />
                <span>For Organizations</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6 tracking-tight">
                Amplify your impact with <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Community Hero</span>
              </h2>
              
              <p className="text-lg text-indigo-200 mb-8 leading-relaxed max-w-xl">
                Are you an NGO, youth club, or volunteer group? Register your organization to host independent drives, accept civic requests, and mobilize thousands of local volunteers through our platform.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  { icon: <ShieldCheck className="w-5 h-5 text-teal-400" />, text: "Receive verified civic issues directly from admins." },
                  { icon: <Globe2 className="w-5 h-5 text-teal-400" />, text: "Publish community drives directly to the public feed." },
                  { icon: <HeartHandshake className="w-5 h-5 text-teal-400" />, text: "Track volunteer hours and issue certificates automatically." }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-1 bg-indigo-800/50 p-1.5 rounded-lg border border-indigo-700/50">
                      {item.icon}
                    </div>
                    <span className="text-indigo-100 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => router.push("/volunteer-org/register")}
                className="bg-white hover:bg-slate-50 text-indigo-900 font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group"
              >
                Register Your Organization
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="relative hidden lg:block">
              {/* Abstract Representation */}
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-indigo-500/20 rounded-[2rem] transform rotate-3 scale-105 border border-white/10 blur-sm"></div>
              <div className="bg-slate-900 border border-slate-700 rounded-[2rem] p-8 shadow-2xl relative transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-inner">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-xl">Green Earth NGO</h3>
                    <p className="text-teal-400 text-sm font-bold">Verified Partner</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-8">
                  <div className="h-2.5 bg-slate-800 rounded-full w-full"></div>
                  <div className="h-2.5 bg-slate-800 rounded-full w-4/5"></div>
                  <div className="h-2.5 bg-slate-800 rounded-full w-5/6"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Drives Hosted</p>
                    <p className="text-white font-black text-2xl">24</p>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Volunteers</p>
                    <p className="text-white font-black text-2xl">1.2k</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
