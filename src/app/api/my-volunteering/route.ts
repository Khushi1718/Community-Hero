import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { VolunteerDrive } from "@/models/VolunteerDrive";
import { VolunteerOrganization } from "@/models/VolunteerOrganization";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Fetch drives the user has joined or requested
    const drives = await VolunteerDrive.find({
      "volunteers.email": email
    }).lean();

    // Map drive roles
    const upcomingDrives: any[] = [];
    const pendingRequests: any[] = [];
    const approvedDrives: any[] = [];
    const completedDrives: any[] = [];
    const rejectedRequests: any[] = [];

    drives.forEach((d: any) => {
      const vol = d.volunteers.find((v: any) => v.email === email);
      if (!vol) return;

      const driveData = {
        _id: d._id,
        title: d.title,
        date: d.date,
        time: d.time,
        status: d.status,
        orgName: d.acceptedOrgName,
        volStatus: vol.status
      };

      if (vol.status === "pending") {
        pendingRequests.push(driveData);
      } else if (vol.status === "rejected") {
        rejectedRequests.push(driveData);
      } else if (vol.status === "approved" || vol.status === "completed") {
        if (d.status === "COMPLETED" || d.status === "VERIFIED" || d.status === "DRIVE_COMPLETED") {
          completedDrives.push(driveData);
        } else {
          approvedDrives.push(driveData);
          upcomingDrives.push(driveData);
        }
      }
    });

    // 2. Fetch Organizations joined
    const orgs = await VolunteerOrganization.find({
      "members.email": email
    }).lean();

    const organizations = orgs.map((o: any) => {
      const member = o.members.find((m: any) => m.email === email);
      return {
        _id: o._id,
        name: o.name,
        logoUrl: o.logoUrl,
        type: o.type,
        status: member?.status
      };
    });

    // 3. Fetch User profile stats
    const user = await User.findOne({ email }).lean();

    return NextResponse.json({
      upcomingDrives,
      pendingRequests,
      approvedDrives,
      completedDrives,
      rejectedRequests,
      organizations,
      stats: user?.communityInfo || {
        volunteerHours: 0,
        organizationsJoined: 0,
        completedDrives: 0,
        attendancePercentage: 100,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
