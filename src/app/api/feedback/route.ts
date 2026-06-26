import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { Feedback } from "@/models/Feedback";
import { VolunteerOrganization } from "@/models/VolunteerOrganization";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { citizenId, orgId, driveId, rating, comment } = body;

    if (!citizenId || !orgId || !driveId || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const feedback = await Feedback.create({
      citizenId, orgId, driveId, rating, comment
    });

    // Update Org Trust Score based on rating
    const org = await VolunteerOrganization.findById(orgId);
    if (org) {
       // simplistic trust score impact: 
       // 5 star = +2, 4 star = +1, 3 star = 0, 2 star = -1, 1 star = -2
       const impact = rating - 3;
       org.trustScore = Math.max(0, Math.min(100, org.trustScore + impact));
       await org.save();
    }

    return NextResponse.json(feedback, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
