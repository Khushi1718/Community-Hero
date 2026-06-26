import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { User } from "@/models/User";
import { VolunteerOrganization } from "@/models/VolunteerOrganization";
import { VolunteerDrive } from "@/models/VolunteerDrive";
import { Certificate } from "@/models/Certificate";

export async function GET() {
  try {
    await connectToDatabase();
    
    const totalCitizens = await User.countDocuments({ role: "citizen" });
    const verifiedOrgs = await VolunteerOrganization.countDocuments({ status: "VERIFIED" });
    const pendingOrgs = await VolunteerOrganization.countDocuments({ status: "PENDING_VERIFICATION" });
    const totalDrives = await VolunteerDrive.countDocuments({});
    const completedDrives = await VolunteerDrive.countDocuments({ status: "VERIFIED" });
    const generatedCertificates = await Certificate.countDocuments({});
    
    const orgs = await VolunteerOrganization.find({ status: "VERIFIED" }).lean();
    const avgTrustScore = orgs.length > 0 ? orgs.reduce((acc, o) => acc + o.trustScore, 0) / orgs.length : 0;
    
    // Aggregation for Cities Covered
    const cities = await VolunteerDrive.distinct("city");
    
    // Mock growth chart
    const communityGrowth = [
      { name: "Jan", citizens: Math.floor(totalCitizens * 0.2), orgs: Math.floor(verifiedOrgs * 0.2) },
      { name: "Feb", citizens: Math.floor(totalCitizens * 0.4), orgs: Math.floor(verifiedOrgs * 0.4) },
      { name: "Mar", citizens: Math.floor(totalCitizens * 0.6), orgs: Math.floor(verifiedOrgs * 0.6) },
      { name: "Apr", citizens: Math.floor(totalCitizens * 0.8), orgs: Math.floor(verifiedOrgs * 0.8) },
      { name: "May", citizens: totalCitizens, orgs: verifiedOrgs }
    ];

    return NextResponse.json({
      totalCitizens,
      verifiedOrgs,
      pendingOrgs,
      totalDrives,
      completedDrives,
      generatedCertificates,
      citiesCovered: cities.length,
      avgTrustScore: avgTrustScore.toFixed(1),
      communityGrowth
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
