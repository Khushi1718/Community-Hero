import connectToDatabase from "@/lib/mongoose";
import { Certificate } from "@/models/Certificate";
import { notFound } from "next/navigation";
import { CheckCircle, Download, Award, Calendar, MapPin, Building, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CertificateVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  await connectToDatabase();
  const certificate = await Certificate.findOne({ certificateId: id });
  
  if (!certificate || (certificate.status !== "Generated" && certificate.status !== "Sent")) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Verification Header */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 text-center mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3">Official Verification</h1>
          <p className="text-slate-600 font-medium max-w-xl mx-auto">
            This certifies the authenticity of the Community Hero volunteer certificate issued to <strong className="text-slate-900">{certificate.volunteerName}</strong>.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-slate-100 text-slate-700 font-mono text-sm font-bold px-4 py-2 rounded-xl border border-slate-200">
            ID: {certificate.certificateId}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Certificate Image Preview */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
              <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 relative group">
                <img 
                  src={certificate.certificateImageUrl} 
                  alt="Certificate" 
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="mt-6 flex gap-4 justify-center">
                <a 
                  href={certificate.certificatePdfUrl} 
                  download 
                  className="flex items-center gap-2 bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                >
                  <Download className="w-5 h-5" /> Download PDF
                </a>
                <a 
                  href={certificate.certificateImageUrl} 
                  download 
                  className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 font-bold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Download className="w-5 h-5" /> Download Image
                </a>
              </div>
            </div>
          </div>

          {/* Details Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-black text-lg text-slate-900 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-500" /> Certificate Details
              </h3>
              
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Awarded To</p>
                  <p className="font-bold text-slate-800">{certificate.volunteerName}</p>
                </div>
                
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Drive Name</p>
                  <p className="font-bold text-slate-800 text-sm">{certificate.driveName}</p>
                </div>
                
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Building className="w-3 h-3"/> Organization</p>
                  <p className="font-bold text-slate-800 text-sm">{certificate.orgName || "Community Hero"}</p>
                </div>
                
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Date of Issue</p>
                  <p className="font-bold text-slate-800">{new Date(certificate.issuedAt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-bold">Verified by Community Hero</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center text-sm font-medium text-slate-500">
              Want to join our next drive? <br/>
              <Link href="/community" className="text-green-600 font-bold hover:underline">Explore Opportunities</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
