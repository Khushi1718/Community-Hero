"use client";

export default function TechStack() {
  const techs = [
    { name: "Next.js 14", category: "App Framework", color: "bg-black text-white" },
    { name: "React", category: "UI Library", color: "bg-blue-500 text-white" },
    { name: "TypeScript", category: "Language", color: "bg-blue-600 text-white" },
    { name: "MongoDB", category: "Database", color: "bg-green-600 text-white" },
    { name: "Tailwind CSS", category: "Styling", color: "bg-sky-500 text-white" },
    { name: "Google Gemini", category: "AI Engine", color: "bg-purple-600 text-white" },
    { name: "Leaflet Maps", category: "Geospatial", color: "bg-emerald-500 text-white" },
    { name: "Clerk Auth", category: "Security", color: "bg-indigo-500 text-white" },
  ];

  return (
    <section className="py-20 bg-slate-50 border-b border-slate-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-10">Modern Stack Powering Community Hero</h3>
        
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {techs.map((tech, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-3 h-3 rounded-full ${tech.color}`}></div>
              <div className="text-left">
                <p className="text-sm font-black text-slate-800 leading-none mb-1">{tech.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tech.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
