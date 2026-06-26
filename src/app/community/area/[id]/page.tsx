import connectToDatabase from "@/lib/mongoose";
import AdoptedArea from "@/models/AdoptedArea";
import { VolunteerOrganization } from "@/models/VolunteerOrganization";
import { VolunteerDrive } from "@/models/VolunteerDrive";
import { Navbar } from "@/components/Navbar";
import { MapPin, Calendar, CheckCircle2, Building2, Clock, Camera } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdoptedAreaPage({ params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const { id } = await params;

  const area = await AdoptedArea.findById(id).lean();
  if (!area) return notFound();

  const org = await VolunteerOrganization.findById(area.organizationId).lean();
  
  const completedDrives = await VolunteerDrive.find({
    adoptedAreaId: id,
    status: "DRIVE_COMPLETED"
  }).sort({ completedAt: -1 }).limit(5).lean();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-indigo-900 opacity-50"></div>
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-300 text-sm font-bold mb-6">
            <CheckCircle2 className="w-4 h-4" /> Officially Adopted Area
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">{area.name}</h1>
          <div className="flex flex-wrap gap-6 text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-400" />
              {area.location}, {area.city}
            </div>
            {org && (
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Maintained by <Link href={`/community/org/${org._id}`} className="font-bold text-white hover:underline">{org.name}</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Adoption Purpose</h2>
              <p className="text-slate-600 leading-relaxed text-lg">{area.reason}</p>
              
              <hr className="my-8 border-slate-100" />
              
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Maintenance Plan</h2>
              <p className="text-slate-600 leading-relaxed">{area.maintenancePlan}</p>
            </div>

            {/* Gallery (Placeholder or from area.photos) */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Camera className="w-6 h-6 text-slate-400" /> Community Gallery
              </h2>
              {area.photos && area.photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {area.photos.map((photo: string, idx: number) => (
                    <img key={idx} src={photo} alt={`Area ${idx}`} className="w-full h-32 object-cover rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100 text-slate-500">
                  No photos uploaded yet.
                </div>
              )}
            </div>
            
            {/* Recent Completed Drives */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Recent Impact Drives</h2>
              {completedDrives.length > 0 ? (
                <div className="space-y-4">
                  {completedDrives.map((drive: any) => (
                    <Link href={`/community/drive/${drive._id}`} key={drive._id} className="block group">
                      <div className="p-4 border border-slate-200 rounded-xl hover:border-emerald-500 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{drive.title}</h3>
                            <p className="text-sm text-slate-500 mt-1">{new Date(drive.completedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                            {drive.hoursWorked} hrs recorded
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 italic">No community drives completed here recently.</div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 text-lg">Adoption Status</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Started</p>
                    <p className="font-semibold text-slate-800">{area.startDate ? new Date(area.startDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Duration</p>
                    <p className="font-semibold text-slate-800">{area.durationMonths} Months</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-md">
              <h3 className="font-bold mb-2 text-lg">Report an Issue</h3>
              <p className="text-indigo-100 text-sm mb-6">Noticed a problem in this adopted area? Report it and it will be smartly routed directly to {org?.name || 'the organization'}.</p>
              <Link href="/report">
                <button className="w-full bg-white text-indigo-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  Report Now
                </button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
