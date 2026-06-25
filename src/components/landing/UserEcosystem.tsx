"use client";

import { UserCircle, Wrench, Shield, Globe } from "lucide-react";

export default function UserEcosystem() {
  const roles = [
    {
      icon: UserCircle,
      title: "Citizen",
      color: "blue",
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
      color: "orange",
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
      color: "green",
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
      color: "purple",
      items: [
        "Oversee national network",
        "Create city administrators",
        "Analyze macro performance",
        "Maintain platform governance"
      ]
    }
  ];

  return (
    <section className="py-24 bg-slate-50 border-b border-slate-200 relative">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Four User Ecosystem</h2>
          <h3 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
            A united front for better cities.
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {roles.map((role, idx) => {
            const colorConfig = {
              blue: "border-blue-200 bg-blue-50 text-blue-700 shadow-blue-500/10 marker:text-blue-500",
              orange: "border-orange-200 bg-orange-50 text-orange-700 shadow-orange-500/10 marker:text-orange-500",
              green: "border-green-200 bg-green-50 text-green-700 shadow-green-500/10 marker:text-green-500",
              purple: "border-purple-200 bg-purple-50 text-purple-700 shadow-purple-500/10 marker:text-purple-500",
            }[role.color as "blue" | "orange" | "green" | "purple"];

            return (
              <div key={idx} className={`rounded-3xl p-8 border bg-white shadow-xl hover:-translate-y-2 transition-all duration-300 ${colorConfig.split('shadow-')[0]} shadow-lg hover:shadow-2xl`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${colorConfig.split('text-')[0].split('shadow-')[0]}`}>
                  <role.icon className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 mb-6">{role.title}</h4>
                <ul className="space-y-4">
                  {role.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-${role.color}-500`} />
                      <span className="text-sm font-bold text-slate-600 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
