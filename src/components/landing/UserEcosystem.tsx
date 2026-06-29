"use client";

import { UserCircle, Wrench, Shield, Globe, Building, Network, ArrowRight, Bell, Cloud } from "lucide-react";

export default function UserEcosystem() {
  const roles = [
    {
      icon: UserCircle,
      title: "Citizen",
      items: [
        "Report civic issues instantly",
        "Upload verified photos/videos",
        "Track issue progress live",
        "Earn civic trust scores"
      ]
    },
    {
      icon: Wrench,
      title: "Municipal Employee",
      items: [
        "Receive assigned tasks",
        "Navigate via GPS routing",
        "Request field materials",
        "Capture official evidence"
      ]
    },
    {
      icon: Shield,
      title: "City Admin",
      items: [
        "Manage city jurisdiction",
        "Review AI analytics",
        "Approve task completions",
        "Monitor live operations"
      ]
    },
    {
      icon: Globe,
      title: "Super Admin",
      items: [
        "Oversee national network",
        "Create city administrators",
        "Analyze macro performance",
        "Maintain platform governance"
      ]
    }
  ];

  return (
    <section className="py-12 bg-slate-50 border-b border-slate-200 relative">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Four User Ecosystem</h2>
          <h3 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
            A united front for better cities.
          </h3>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory pb-6 -mx-4 px-4 md:-mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {roles.map((role, idx) => (
            <div key={idx} className="w-[85vw] shrink-0 snap-center md:w-auto rounded-xl p-7 border border-green-200 bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-green-500/5">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-green-50 text-green-600 border border-green-100">
                  <role.icon className="w-6 h-6 stroke-[2.5]" />
                </div>
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
            </div>
          ))}
        </div>

        {/* Integrations Banner */}
        <div className="mt-16 bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="lg:w-1/3">
            <h4 className="text-xl font-bold text-slate-900 mb-3">Seamless Government Integrations</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Already have an existing municipal CRM? No need to shift platforms. Community Hero integrates directly with your legacy systems to seamlessly push and pull issue reports. Powered by <strong className="text-blue-600">Google Cloud Pub/Sub</strong>, we guarantee real-time, secure, and scalable data exchange without interrupting your current workflow.
            </p>
          </div>
          
          <div className="lg:w-2/3 flex items-center justify-between w-full gap-2 overflow-x-auto pb-4 lg:pb-0">
            {/* Flow diagram */}
            <div className="flex flex-col items-center gap-3 min-w-[100px]">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                <Building className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-slate-700 text-center">External<br/>Gov. CRM</span>
            </div>
            
            <ArrowRight className="w-5 h-5 text-slate-300 shrink-0" />
            
            {/* Normal Google Cloud Pub/Sub Node */}
            <div className="flex flex-col items-center gap-3 min-w-[100px]">
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                <Cloud className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-slate-700 text-center">Google Cloud<br/>Pub/Sub</span>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-300 shrink-0" />

            <div className="flex flex-col items-center gap-3 min-w-[100px]">
              <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shadow-sm">
                <Shield className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-slate-700 text-center">Community<br/>Hero Platform</span>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-300 shrink-0" />

            <div className="flex flex-col items-center gap-3 min-w-[100px]">
              <div className="w-16 h-16 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                <Bell className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-slate-700 text-center">Real-time Sync<br/>& Notifications</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
