"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Award, Calendar, Clock, MapPin, Building2, User, Download, ExternalLink } from "lucide-react";

export default function VerifyCertificatePage() {
  const params = useParams() as { id: string };
  const id = params?.id;
  const router = useRouter();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/certificates/${id}`)
      .then(res => res.json())
      .then(data => {
        setCert(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!cert || cert.error) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-6">
         <XCircle className="w-20 h-20 text-red-500 mb-6" />
         <h1 className="text-3xl font-black text-slate-900 mb-2">Invalid Certificate</h1>
         <p className="text-slate-500 max-w-md">This certificate ID could not be found in our records. It may be invalid or forged.</p>
         <button onClick={() => router.push("/")} className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">Return Home</button>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
      <div className="max-w-[800px] mx-auto space-y-8">
        
        {/* Validation Header */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center flex flex-col items-center">
           <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
           </div>
           <h1 className="text-3xl font-black text-emerald-800 mb-2">Certificate Verified</h1>
           <p className="text-emerald-600 font-medium max-w-lg">
             This is a verified and authentic Community Hero record of civic impact.
           </p>
           <p className="mt-4 font-mono text-sm font-bold text-emerald-700 bg-emerald-100 px-4 py-2 rounded-lg">ID: {cert.certificateId}</p>
        </div>

        {/* Certificate Details */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
           <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
           <div className="p-8 sm:p-12 space-y-8">
              
              <div className="flex justify-between items-start border-b border-slate-100 pb-8">
                 <div>
                   <h2 className="text-[10px] font-black uppercase tracking-wider text-amber-500 mb-1">Official Document</h2>
                   <h3 className="text-2xl font-black text-slate-900 leading-tight">
                      {cert.type === "VOLUNTEER" ? "Certificate of Civic Impact" : "Certificate of Organizational Excellence"}
                   </h3>
                 </div>
                 <Award className="w-12 h-12 text-amber-100 shrink-0" />
              </div>

              <div className="space-y-6">
                 <div>
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Awarded To</p>
                   <p className="text-3xl font-black text-slate-900">{cert.issuedToName}</p>
                   <p className="text-slate-500 font-medium mt-1">{cert.issuedToType === "citizen" ? "Community Volunteer" : "Verified Organization"}</p>
                 </div>
                 
                 {cert.geminiMessage && (
                   <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic text-slate-700 font-medium">
                      "{cert.geminiMessage}"
                   </div>
                 )}

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                    {cert.driveName && (
                      <div className="flex gap-4 items-start">
                         <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><CheckCircle2 className="w-5 h-5 text-blue-500"/></div>
                         <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Community Drive</p>
                            <p className="font-bold text-slate-900">{cert.driveName}</p>
                         </div>
                      </div>
                    )}
                    {cert.orgName && cert.type === "VOLUNTEER" && (
                      <div className="flex gap-4 items-start">
                         <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0"><Building2 className="w-5 h-5 text-indigo-500"/></div>
                         <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hosted By</p>
                            <p className="font-bold text-slate-900">{cert.orgName}</p>
                         </div>
                      </div>
                    )}
                    {cert.hours && (
                      <div className="flex gap-4 items-start">
                         <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-emerald-500"/></div>
                         <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Volunteer Hours</p>
                            <p className="font-bold text-slate-900">{cert.hours} Hours</p>
                         </div>
                      </div>
                    )}
                    <div className="flex gap-4 items-start">
                       <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0"><Calendar className="w-5 h-5 text-amber-500"/></div>
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Issued On</p>
                          <p className="font-bold text-slate-900">{new Date(cert.issuedAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                 </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
}
