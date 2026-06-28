"use client";

import { Edit, Users, Megaphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LandingHero() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  const handleReport = () => {
    if (loading) return;
    if (!user) router.push("/login");
    else if (role === "citizen") router.push("/report");
    else if (role === "super_admin") router.push("/super-admin");
    else if (role === "admin") router.push("/admin");
    else if (role === "employee") router.push("/employee");
  };

  const handleJoinDrive = () => {
    router.push("/community"); 
  };

  return (
    <>
      <section className="relative min-h-[500px] lg:min-h-[600px] flex items-center">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/heroo.png')" }}
        />
        <div className="absolute inset-0 z-0 bg-black/60" /> {/* Dark overlay for text readability */}

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-20 pb-20">
          {/* Left Content */}
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight mb-6">
              Empowering Citizens.<br />Equipping Municipalities.
            </h1>
            
            <div className="w-16 h-1 bg-[#2e7d32] mb-8 rounded-full" />
            
            <p className="text-xl md:text-2xl text-gray-200 mb-10 leading-relaxed max-w-2xl font-medium">
              A unified civic governance platform where citizens report issues, officials resolve them, and volunteers drive local action.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={handleReport} 
                className="w-full sm:w-auto bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-medium text-lg px-8 py-3 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Report an Issue
              </button>
              <button 
                onClick={handleJoinDrive} 
                className="w-full sm:w-auto bg-transparent border border-white hover:bg-white/10 text-white font-medium text-lg px-8 py-3 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                Join a Drive
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Announcement Banner */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-[#2e7d32] font-bold whitespace-nowrap">
            <Megaphone className="w-5 h-5" />
            Latest Announcement
          </div>
          <p className="text-gray-700 font-medium text-center sm:text-left">
            Join the 'Clean Surroundings Drive' in your area this weekend.
          </p>
          <button onClick={() => router.push("/community")} className="text-blue-600 hover:text-blue-800 font-semibold underline whitespace-nowrap">
            Know More
          </button>
        </div>
      </div>
    </>
  );
}
