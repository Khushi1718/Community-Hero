import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { VolunteerOrganization } from "@/models/VolunteerOrganization";
import { VolunteerDrive } from "@/models/VolunteerDrive";
import { CommunityPost } from "@/models/CommunityPost";
import AdoptedArea from "@/models/AdoptedArea";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ organizations: [], drives: [], posts: [], areas: [] });
    }

    const regex = new RegExp(query, "i");

    // Search Organizations
    const organizations = await VolunteerOrganization.find({
      status: "VERIFIED",
      $or: [
        { name: regex },
        { description: regex },
        { city: regex },
        { workCategories: regex }
      ]
    }).limit(10).select("name _id coverImageUrl city trustScore");

    // Search Drives
    const drives = await VolunteerDrive.find({
      status: { $in: ["ORG_APPROVED", "VOLUNTEER_REG_OPEN", "DRIVE_COMPLETED"] },
      $or: [
        { title: regex },
        { description: regex },
        { city: regex },
        { category: regex }
      ]
    }).limit(10).select("title _id category city date status");

    // Search Stories / Posts
    const posts = await CommunityPost.find({
      status: "PUBLISHED",
      $or: [
        { title: regex },
        { summary: regex },
        { content: regex },
        { city: regex }
      ]
    }).limit(10).select("title _id summary beforeImageUrl city createdAt");

    // Search Adopted Areas
    const areas = await AdoptedArea.find({
      status: "ADOPTED",
      $or: [
        { name: regex },
        { location: regex },
        { city: regex }
      ]
    }).limit(10).select("name _id location city durationMonths");

    return NextResponse.json({
      organizations,
      drives,
      posts,
      areas
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
