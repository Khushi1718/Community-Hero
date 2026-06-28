"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, MapPin, Users, HeartHandshake, ShieldCheck, CheckCircle2, ArrowLeft, Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function OrgDetailsPage() {
  const params = useParams() as { id: string };
  const { id } = params;
  const router = useRouter();
  const { user, appUser } = useAuth();
  
  const [org, setOrg] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Join Modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinName, setJoinName] = useState(user?.displayName || appUser?.name || "");
  const [joinPhone, setJoinPhone] = useState("");
  const [joinEmail, setJoinEmail] = useState(user?.email || appUser?.email || "");
  const [joinAge, setJoinAge] = useState("");
  const [joinSkills, setJoinSkills] = useState("");
  const [joinAvailability, setJoinAvailability] = useState("");
  const [joinMotivation, setJoinMotivation] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    fetch(`/api/volunteer-org/${id}`)
      .then(res => res.json())
      .then(data => {
         setOrg(data);
         setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [id]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoining(true);
    try {
      const res = await fetch(`/api/volunteer-org/${id}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            action: "join_org",
            name: joinName,
            email: joinEmail,
            phone: joinPhone,
            age: parseInt(joinAge),
            skills: joinSkills,
            availability: joinAvailability,
            motivation: joinMotivation,
            userId: user?.email || appUser?.email
         })
      });
      if (res.ok) {
         alert("Membership request submitted successfully!");
         setShowJoinModal(false);
         router.push("/profile");
      } else {
         const err = await res.json();
         alert(err.error || "Failed to join.");
      }
    } catch {
       alert("Error submitting request.");
    } finally {
       setIsJoining(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!org) return <div className="min-h-screen flex items-center justify-center">Organization not found.</div>;

  const currentUserEmail = user?.email || appUser?.email;
  const myStatus = org.members?.find((m: any) => m.email === currentUserEmail)?.status;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-[120px]">
      <div className="max-w-[1000px] mx-auto px-4 py-8">
         <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-6">
            <ArrowLeft className="w-5 h-5"/> Back to Hub
         </button>
         
         <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative mb-8">
            <div className="h-48 bg-gradient-to-br from-green-600 to-emerald-900 relative">
               {org.coverImageUrl && <img src={org.coverImageUrl} className="w-full h-full object-cover opacity-60 mix-blend-overlay" />}
               <div className="absolute -bottom-12 left-8 w-24 h-24 bg-white rounded-2xl border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                   {org.logoUrl ? <img src={org.logoUrl} className="w-full h-full object-cover"/> : <Building2 className="w-10 h-10 text-emerald-600" />}
               </div>
            </div>
            
            <div className="pt-16 pb-8 px-8">
               <div className="flex items-center justify-between mb-2">
                  <h1 className="text-3xl font-black text-slate-900">{org.name}</h1>
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-black px-3 py-1.5 rounded-full uppercase"><ShieldCheck className="w-4 h-4"/> Verified</span>
               </div>
               
               <p className="text-blue-600 font-bold text-sm flex items-center gap-2 mb-6">
                  {org.type} <MapPin className="w-4 h-4 ml-2"/> {org.city}, {org.state}
               </p>
               
               <p className="text-slate-600 text-lg leading-relaxed mb-8">{org.description || org.mission || "Dedicated to improving our community."}</p>
               
               {myStatus ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                     <div className="flex items-center gap-3 text-blue-800">
                        <CheckCircle2 className="w-6 h-6" />
                        <div>
                           <p className="font-bold">You have applied to this organization.</p>
                           <p className="text-sm opacity-80">Current Status: <span className="uppercase font-black">{myStatus}</span></p>
                        </div>
                     </div>
                  </div>
               ) : (
                  <button 
                     onClick={() => setShowJoinModal(true)}
                     className="py-3 px-8 rounded-xl font-black text-white bg-slate-900 hover:bg-slate-800 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                     <Users className="w-5 h-5"/> Become a Member
                  </button>
               )}
            </div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center shadow-sm">
               <Trophy className="w-10 h-10 text-green-500 mb-3" />
               <h3 className="text-4xl font-black text-slate-900">{org.completedDrivesCount || 0}</h3>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Completed Drives</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center shadow-sm">
               <Users className="w-10 h-10 text-blue-500 mb-3" />
               <h3 className="text-4xl font-black text-slate-900">{org.activeMembers || 0}</h3>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Active Members</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center shadow-sm">
               <ShieldCheck className="w-10 h-10 text-emerald-500 mb-3" />
               <h3 className="text-4xl font-black text-slate-900">{org.trustScore}/100</h3>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Trust Score</p>
            </div>
         </div>
      </div>
      
      {/* Join Modal */}
      {showJoinModal && (
         <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isJoining && setShowJoinModal(false)}></div>
            <div className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
               <h2 className="text-2xl font-black text-slate-900 mb-2">Join {org.name}</h2>
               <p className="text-sm text-slate-500 mb-6">Apply to become a core member of this organization.</p>
               
               <form onSubmit={handleJoin} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                        <input required type="text" value={joinName} onChange={e=>setJoinName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Age</label>
                        <input required type="number" min="16" value={joinAge} onChange={e=>setJoinAge(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
                        <input required type="email" value={joinEmail} onChange={e=>setJoinEmail(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Phone</label>
                        <input required type="tel" value={joinPhone} onChange={e=>setJoinPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                     </div>
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-700 block mb-1">Skills</label>
                     <input required type="text" value={joinSkills} onChange={e=>setJoinSkills(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="e.g. Photography, Logistics, Teaching" />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-700 block mb-1">Availability</label>
                     <input required type="text" value={joinAvailability} onChange={e=>setJoinAvailability(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="e.g. Weekends, Evenings" />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-700 block mb-1">Why do you want to join?</label>
                     <textarea required value={joinMotivation} onChange={e=>setJoinMotivation(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none resize-none" rows={3}></textarea>
                  </div>
                  
                  <button type="submit" disabled={isJoining} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 mt-4">
                     {isJoining ? "Submitting..." : "Submit Application"}
                  </button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}
