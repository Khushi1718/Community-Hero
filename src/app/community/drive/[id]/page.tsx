"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Users, HeartHandshake, ShieldCheck, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function DriveDetailsPage() {
  const params = useParams() as { id: string };
  const { id } = params;
  const router = useRouter();
  const { user, appUser } = useAuth();
  
  const [drive, setDrive] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Join Modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinName, setJoinName] = useState(user?.displayName || appUser?.name || "");
  const [joinPhone, setJoinPhone] = useState("");
  const [joinEmail, setJoinEmail] = useState(user?.email || appUser?.email || "");
  const [joinAge, setJoinAge] = useState("");
  const [reasonForJoining, setReasonForJoining] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [agreeGuidelines, setAgreeGuidelines] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    fetch(`/api/community-drives/${id}`)
      .then(res => res.json())
      .then(data => {
         setDrive(data);
         setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [id]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeGuidelines) return alert("You must agree to the guidelines.");
    
    setIsJoining(true);
    try {
      const res = await fetch(`/api/community-drives/${id}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            action: "volunteer_join",
            name: joinName,
            email: joinEmail,
            phone: joinPhone,
            age: parseInt(joinAge),
            reasonForJoining,
            emergencyContact,
            userId: user?.email || appUser?.email
         })
      });
      if (res.ok) {
         alert("Request submitted successfully!");
         setShowJoinModal(false);
         router.push("/my-volunteering");
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
  if (!drive) return <div className="min-h-screen flex items-center justify-center">Drive not found.</div>;

  const isFull = drive.maxVolunteers ? drive.joinedVolunteers >= drive.maxVolunteers : false;
  const isClosed = drive.status === "REG_CLOSED" || isFull;
  const isPast = ["DRIVE_IN_PROGRESS", "DRIVE_COMPLETED", "ADMIN_VERIFICATION_PENDING", "VERIFIED", "COMPLETED"].includes(drive.status);
  
  const currentUserEmail = user?.email || appUser?.email;
  const hasApplied = drive.volunteers?.some((v: any) => v.email === currentUserEmail);
  const myStatus = drive.volunteers?.find((v: any) => v.email === currentUserEmail)?.status;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-[120px]">
      <div className="max-w-[1000px] mx-auto px-4 py-8">
         <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-6">
            <ArrowLeft className="w-5 h-5"/> Back
         </button>
         
         <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
            {isClosed && !isPast && <div className="absolute top-8 right-8 bg-red-100 text-red-700 font-black px-4 py-2 rounded-full uppercase tracking-wider text-sm">Registration Closed</div>}
            
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm">🌱</div>
            
            <h1 className="text-4xl font-black text-slate-900 mb-2">{drive.title}</h1>
            <p className="text-green-600 font-bold text-lg flex items-center gap-2 mb-8">
               <ShieldCheck className="w-5 h-5"/> by {drive.orgName}
            </p>
            
            <p className="text-slate-600 text-lg leading-relaxed mb-8">{drive.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                  <p className="font-bold text-slate-900 flex items-center gap-2"><Calendar className="w-4 h-4 text-green-600"/> {new Date(drive.date).toLocaleDateString()}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time</p>
                  <p className="font-bold text-slate-900 flex items-center gap-2"><Clock className="w-4 h-4 text-green-600"/> {drive.time}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                  <p className="font-bold text-slate-900 flex items-center gap-2 truncate" title={`${drive.address}, ${drive.city}`}><MapPin className="w-4 h-4 text-green-600"/> {drive.city}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Capacity</p>
                  <p className="font-bold text-slate-900 flex items-center gap-2"><Users className="w-4 h-4 text-green-600"/> {drive.joinedVolunteers} / {drive.maxVolunteers || drive.requiredVolunteers}</p>
               </div>
            </div>
            
            {hasApplied ? (
               <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-blue-800">
                     <CheckCircle2 className="w-6 h-6" />
                     <div>
                        <p className="font-bold">You have applied for this drive.</p>
                        <p className="text-sm opacity-80">Current Status: <span className="uppercase font-black">{myStatus}</span></p>
                     </div>
                  </div>
                  <button onClick={() => router.push("/my-volunteering")} className="bg-blue-800 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-blue-900 transition-colors">View Dashboard</button>
               </div>
            ) : (
               <button 
                  onClick={() => setShowJoinModal(true)}
                  disabled={isClosed || isPast}
                  className={`w-full py-4 rounded-xl font-black text-lg transition-all flex justify-center items-center gap-2 ${isClosed || isPast ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-green-600 text-white shadow-xl shadow-green-600/20 hover:scale-[1.02] active:scale-95"}`}
               >
                  <HeartHandshake className="w-6 h-6"/> {isClosed ? "Registration Full" : isPast ? "Drive Finished" : "Apply to Volunteer"}
               </button>
            )}
         </div>
      </div>
      
      {/* Join Modal */}
      {showJoinModal && (
         <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isJoining && setShowJoinModal(false)}></div>
            <div className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
               <h2 className="text-2xl font-black text-slate-900 mb-2">Volunteer Application</h2>
               <p className="text-sm text-slate-500 mb-6">The organization will review your profile and application.</p>
               
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
                     <label className="text-xs font-bold text-slate-700 block mb-1">Emergency Contact</label>
                     <input type="text" value={emergencyContact} onChange={e=>setEmergencyContact(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="Name & Phone" />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-700 block mb-1">Why do you want to join?</label>
                     <textarea required value={reasonForJoining} onChange={e=>setReasonForJoining(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none resize-none" rows={3}></textarea>
                  </div>
                  
                  <div className="flex gap-3 items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
                     <input type="checkbox" id="agree" checked={agreeGuidelines} onChange={e=>setAgreeGuidelines(e.target.checked)} className="mt-1 accent-green-600"/>
                     <label htmlFor="agree" className="text-xs text-slate-600">I agree to follow the community guidelines and understand that my participation is subject to approval by the organization.</label>
                  </div>

                  <button type="submit" disabled={isJoining} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50">
                     {isJoining ? "Submitting..." : "Submit Application"}
                  </button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}
