import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { VolunteerDrive } from "@/models/VolunteerDrive";
import { Feedback } from "@/models/Feedback";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");
    
    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

    const drives = await VolunteerDrive.find({ acceptedOrgId: orgId }).lean();
    const completedDrives = drives.filter(d => d.status === "VERIFIED" || d.status === "ADMIN_VERIFICATION_PENDING" || d.status === "DRIVE_COMPLETED");
    
    let totalVolunteers = 0;
    let totalPresent = 0;
    
    completedDrives.forEach(d => {
       if (d.volunteers) {
          totalVolunteers += d.volunteers.length;
          totalPresent += d.volunteers.filter(v => v.attendance === "present").length;
       }
    });

    const retentionRate = totalVolunteers > 0 ? (totalPresent / totalVolunteers) * 100 : 0;
    
    const feedbacks = await Feedback.find({ orgId }).lean();
    const avgRating = feedbacks.length > 0 ? feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length : 0;
    
    // Monthly growth mock logic for recharts
    const monthlyGrowth = [
      { name: "Jan", volunteers: Math.floor(Math.random() * 50) + 10, drives: 1 },
      { name: "Feb", volunteers: Math.floor(Math.random() * 50) + 20, drives: 2 },
      { name: "Mar", volunteers: Math.floor(Math.random() * 50) + 30, drives: 3 },
      { name: "Apr", volunteers: Math.floor(Math.random() * 50) + 40, drives: 2 },
      { name: "May", volunteers: totalVolunteers, drives: completedDrives.length }
    ];

    return NextResponse.json({
      totalDrives: drives.length,
      completedDrives: completedDrives.length,
      retentionRate: retentionRate.toFixed(1),
      avgRating: avgRating.toFixed(1),
      monthlyGrowth
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
