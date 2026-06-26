import { VolunteerOrganization } from "@/models/VolunteerOrganization";
import { VolunteerDrive } from "@/models/VolunteerDrive";
import { Issue } from "@/models/Issue";
import { Certificate } from "@/models/Certificate";
import connectToDatabase from "@/lib/mongoose";
import { Navbar } from "@/components/Navbar";
import { ShieldCheck, Users, CalendarCheck, Award, TrendingUp, Building2 } from "lucide-react";

export const revalidate = 3600; // Cache for 1 hour

export default async function TransparencyPage() {
  await connectToDatabase();

  const [
    totalOrgs,
    completedDrives,
    certificatesIssued,
    totalIssuesResolved,
    totalVolunteerHours,
    orgRanking
  ] = await Promise.all([
    VolunteerOrganization.countDocuments({ status: "VERIFIED" }),
    VolunteerDrive.countDocuments({ status: "DRIVE_COMPLETED" }),
    Certificate.countDocuments(),
    Issue.countDocuments({ status: { $in: ["Resolved", "Closed"] } }),
    VolunteerDrive.aggregate([
      { $match: { status: "DRIVE_COMPLETED" } },
      { $group: { _id: null, total: { $sum: "$hoursWorked" } } }
    ]),
    VolunteerOrganization.find({ status: "VERIFIED" })
      .sort({ trustScore: -1 })
      .limit(5)
      .select("name trustScore city completedDrives totalVolunteerHours")
  ]);

  const hours = totalVolunteerHours[0]?.total || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <ShieldCheck className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
          <h1 className="text-5xl font-black mb-4 tracking-tight">Public Transparency Portal</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Real-time, immutable metrics reflecting the true impact of citizens, organizations, and municipal employees working together.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={<Building2 />} title="Verified Orgs" value={totalOrgs} color="blue" />
          <StatCard icon={<CalendarCheck />} title="Completed Drives" value={completedDrives} color="emerald" />
          <StatCard icon={<Users />} title="Volunteer Hours" value={hours} color="purple" />
          <StatCard icon={<Award />} title="Certificates Issued" value={certificatesIssued} color="amber" />
        </div>

        <div className="mt-16 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-500" /> Top Community Organizations
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200">
                  <th className="pb-4 font-semibold">Rank</th>
                  <th className="pb-4 font-semibold">Organization</th>
                  <th className="pb-4 font-semibold">City</th>
                  <th className="pb-4 font-semibold">Trust Score</th>
                  <th className="pb-4 font-semibold">Drives</th>
                  <th className="pb-4 font-semibold">Hours</th>
                </tr>
              </thead>
              <tbody>
                {orgRanking.map((org: any, idx: number) => (
                  <tr key={org._id.toString()} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 font-bold text-slate-800">#{idx + 1}</td>
                    <td className="py-4 font-semibold text-emerald-600">{org.name}</td>
                    <td className="py-4 text-slate-600">{org.city}</td>
                    <td className="py-4 font-bold text-amber-500">{org.trustScore}</td>
                    <td className="py-4 text-slate-600">{org.completedDrives || 0}</td>
                    <td className="py-4 text-slate-600">{org.totalVolunteerHours || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 text-center text-slate-500 text-sm">
          Data is updated hourly. Total Issues Resolved directly by municipality: <span className="font-bold text-slate-700">{totalIssuesResolved}</span>.
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }: { icon: any, title: string, value: number, color: string }) {
  const colorMap: any = {
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    purple: "bg-purple-100 text-purple-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
      <div className={`p-4 rounded-xl ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-black text-slate-800 mt-1">{value}</p>
      </div>
    </div>
  );
}
