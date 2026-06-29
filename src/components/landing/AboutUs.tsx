import { ClipboardCheck, Users, Award, BarChart2, Users2 } from "lucide-react";

export default function AboutUs() {
  return (
    <section className="bg-white border-b border-slate-200 font-sans">
      <div className="max-w-[1400px] mx-auto">
        {/* Top Section: Text and Image */}
        <div className="flex flex-col lg:flex-row min-h-[500px]">
          {/* Left Text */}
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col justify-center">
            <h2 className="text-4xl font-bold text-[#0f172a] mb-3">About Community Hero</h2>
            <h3 className="text-[#2e7d32] font-semibold text-lg mb-8">
              Empowering Citizens. Strengthening Communities. Transforming Cities.
            </h3>
            
            <p className="text-[#334155] text-base leading-relaxed mb-6 font-medium">
              Community Hero is an AI-powered civic engagement platform designed to bridge the gap between citizens, government authorities, NGOs, and volunteers. We believe that <strong className="font-semibold text-black">creating better cities</strong> requires more than just reporting problems—it requires <strong className="font-semibold text-black">collaboration, transparency, and active community participation.</strong>
            </p>
            
            <p className="text-[#334155] text-base leading-relaxed font-medium">
              Traditional complaint systems often leave citizens without updates, while many community-driven initiatives struggle to reach volunteers and measure their impact. Community Hero brings everything together on a single intelligent platform where civic issues can be reported, analyzed, tracked, and resolved while encouraging people to become part of the solution.
            </p>
          </div>
          
          {/* Right Image */}
          <div className="flex-1 relative hidden lg:block overflow-hidden min-h-[400px]">
            {/* The curved cut-out effect can be achieved using an SVG or border radius trick. 
                Using a pseudo-element or clip-path for the exact curve. */}
            <div 
               className="absolute inset-0 bg-cover bg-center"
               style={{ backgroundImage: "url('/images/hero-bg.png')" }} 
            >
              {/* Green curved separator overlay */}
              <div 
                className="absolute top-0 bottom-0 left-0 w-16 bg-white"
                style={{ clipPath: "ellipse(150% 50% at -50% 50%)" }}
              />
              <div 
                className="absolute top-0 bottom-0 left-0 w-16 border-r-2 border-[#2e7d32]"
                style={{ clipPath: "ellipse(150% 50% at -50% 50%)" }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* 5 Columns Feature Section */}
      <div className="border-t border-slate-100 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex overflow-x-auto snap-x snap-mandatory pb-6 -mx-4 px-4 md:-mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            <div className="flex flex-col h-full w-[85vw] shrink-0 snap-center md:w-auto">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[#2e7d32] mb-4 border border-green-100 shrink-0">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#0f172a] text-lg mb-3 shrink-0">Citizen Reporters</h4>
              <p className="text-[#475569] text-sm leading-relaxed font-medium flex-grow">
                Citizens easily report local issues like potholes or broken streetlights with GPS evidence. AI triage categorizes these reports, ensuring they are routed to the right departments instantly for rapid, transparent resolution.
              </p>
            </div>
            
            <div className="flex flex-col h-full w-[85vw] shrink-0 snap-center md:w-auto">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[#2e7d32] mb-4 border border-green-100 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#0f172a] text-lg mb-3 shrink-0">Community Drives</h4>
              <p className="text-[#475569] text-sm leading-relaxed font-medium flex-grow">
                Verified organizations can launch local community drives and recruit enthusiastic volunteers directly through the platform. Participants collaborate to address challenges collectively, building stronger, resilient neighborhoods through structured civic participation.
              </p>
            </div>
            
            <div className="flex flex-col h-full w-[85vw] shrink-0 snap-center md:w-auto">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[#2e7d32] mb-4 border border-green-100 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#0f172a] text-lg mb-3 shrink-0">Municipal Employees</h4>
              <p className="text-[#475569] text-sm leading-relaxed font-medium flex-grow">
                Field workers receive verified tasks with exact coordinates. Once repairs are completed, employees must upload timestamped, geofenced 'After' photos via the app to securely close out the issue and maintain public accountability.
              </p>
            </div>

            <div className="flex flex-col h-full w-[85vw] shrink-0 snap-center md:w-auto">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[#2e7d32] mb-4 border border-green-100 shrink-0">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#0f172a] text-lg mb-3 shrink-0">City Administrators</h4>
              <p className="text-[#475569] text-sm leading-relaxed font-medium flex-grow">
                Local admins manage municipal operations through dynamic dashboards. They can seamlessly allocate resources, monitor field employee performance, and track city-wide resolution metrics in real-time, ensuring optimal efficiency and maximizing public satisfaction.
              </p>
            </div>
            
            <div className="flex flex-col h-full w-[85vw] shrink-0 snap-center md:w-auto">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[#2e7d32] mb-4 border border-green-100 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h4 className="font-bold text-[#0f172a] text-lg mb-3 shrink-0">Superadmin Oversight</h4>
              <p className="text-[#475569] text-sm leading-relaxed font-medium flex-grow">
                Superadmins maintain platform integrity by verifying NGOs and overseeing multi-city operations. They ensure the ecosystem remains secure and scalable, acting as the ultimate authority for system configurations and high-level trust verification.
              </p>
            </div>

          </div>
        </div>
      </div>
      
      {/* Bottom CTA Bar */}
      <div className="border-t border-slate-200 bg-white py-12 shadow-[inset_0_10px_30px_-15px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-center gap-6">
          <div className="text-[#1b5e20] flex items-center justify-center">
            <Users2 className="w-12 h-12" />
          </div>
          
          <div className="hidden md:block w-[1px] h-12 bg-slate-300"></div>
          
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-[#1b5e20] mb-1">
              Together, we don't just report problems—we solve them.
            </h3>
            <p className="text-slate-500 font-medium text-base">
              Let's build cleaner, safer, smarter, and more sustainable communities.
            </p>
          </div>
        </div>
      </div>

    </section>
  );
}
