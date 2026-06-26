"use client";

import { useState, useEffect } from "react";
import { Trophy, Star, TrendingUp, TrendingDown, Minus, Medal, MapPin, Users, HeartHandshake, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LeaderboardPage() {
  const [category, setCategory] = useState("volunteers");
  const [timeFilter, setTimeFilter] = useState("all_time");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?category=${category}&timeFilter=${timeFilter}`)
      .then(res => res.json())
      .then(data => {
        setLeaderboard(data.leaderboard || []);
        setLoading(false);
      });
  }, [category, timeFilter]);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
      <div className="max-w-[1000px] mx-auto space-y-8">
        
        <div className="text-center space-y-4">
           <div className="inline-flex items-center justify-center p-4 bg-amber-100 rounded-full mb-2">
             <Trophy className="w-12 h-12 text-amber-500" />
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Community Leaders</h1>
           <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
             Recognizing the top contributors making a real, verified impact in our cities.
           </p>
        </div>

        <div className="bg-white rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-sm border border-slate-200">
           <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
             {["volunteers", "organizations"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold capitalize transition-all whitespace-nowrap ${
                    category === cat ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  {cat}
                </button>
             ))}
           </div>
           <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto ml-auto">
             {["today", "week", "month", "all_time"].map((time) => (
                <button
                  key={time}
                  onClick={() => setTimeFilter(time)}
                  className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                    timeFilter === time ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  {time.replace("_", " ")}
                </button>
             ))}
           </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
             <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold">Calculating Rankings...</p>
             </div>
          ) : leaderboard.length === 0 ? (
             <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <Trophy className="w-12 h-12 mb-2 opacity-20" />
                <p className="font-bold">No data found for this period.</p>
             </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leaderboard.map((item, index) => (
                <div key={item.id} className="p-4 sm:p-6 flex items-center gap-4 sm:gap-6 hover:bg-slate-50 transition-colors group">
                  
                  {/* Rank & Movement */}
                  <div className="flex flex-col items-center justify-center w-12 shrink-0">
                     {index < 3 ? (
                       <Medal className={`w-8 h-8 ${index === 0 ? "text-amber-400" : index === 1 ? "text-slate-300" : "text-amber-700"}`} />
                     ) : (
                       <span className="text-xl font-black text-slate-400">#{item.rank}</span>
                     )}
                     <div className="mt-1 flex items-center gap-0.5">
                       {item.movement === "up" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                       {item.movement === "down" && <TrendingDown className="w-3 h-3 text-red-500" />}
                       {item.movement === "same" && <Minus className="w-3 h-3 text-slate-300" />}
                     </div>
                  </div>

                  {/* Profile */}
                  <div className="flex-1 min-w-0">
                     <h3 className="text-lg font-black text-slate-900 truncate flex items-center gap-2">
                        {item.name}
                        {category === "organizations" && <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />}
                     </h3>
                     <div className="flex flex-wrap items-center gap-3 mt-1">
                        {item.city && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                            <MapPin className="w-3 h-3" /> {item.city}
                          </span>
                        )}
                        {category === "volunteers" ? (
                           <>
                             <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500"><HeartHandshake className="w-3 h-3"/> {item.drives} Drives</span>
                             {item.badges?.slice(0, 2).map((b: string) => (
                               <span key={b} className="inline-flex items-center bg-amber-100 text-amber-800 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm">{b}</span>
                             ))}
                           </>
                        ) : (
                           <>
                             <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500"><Users className="w-3 h-3"/> {item.volunteers} Members</span>
                             <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500"><HeartHandshake className="w-3 h-3"/> {item.drives} Drives</span>
                           </>
                        )}
                     </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                     <p className="text-2xl font-black text-amber-500 tracking-tight flex items-center gap-1 justify-end">
                       {category === "volunteers" ? item.points : item.impactScore} <Star className="w-5 h-5 fill-amber-500" />
                     </p>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
                       {category === "volunteers" ? "Hero Points" : "Impact Score"}
                     </p>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
