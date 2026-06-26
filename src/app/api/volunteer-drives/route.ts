import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { VolunteerDrive } from "@/models/VolunteerDrive";
import { VolunteerOrganization } from "@/models/VolunteerOrganization";

/**
 * GET /api/volunteer-drives
 * List drives — filterable by city, state, category, status, orgId
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const orgId = searchParams.get("orgId");

    const query: any = {};
    if (city) query.city = { $regex: new RegExp(`^${city.trim()}$`, "i") };
    if (state) query.state = { $regex: new RegExp(`^${state.trim()}$`, "i") };
    if (category) query.category = category;
    if (status) query.status = status;
    if (orgId) query.orgId = orgId;

    const drives = await VolunteerDrive.find(query)
      .sort({ date: 1, createdAt: -1 })
      .populate("orgId", "name logoUrl trustScore");

    return NextResponse.json(drives);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/volunteer-drives
 * Create a new drive (organization only)
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Validate the organization exists and is verified
    if (!body.orgId) {
      return NextResponse.json({ error: "orgId is required." }, { status: 400 });
    }

    const org = await VolunteerOrganization.findById(body.orgId);
    if (!org) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }
    if (org.status !== "VERIFIED") {
      return NextResponse.json(
        { error: "Only verified organizations can create drives." },
        { status: 403 }
      );
    }

    // Populate org details
    body.orgName = org.name;
    body.orgCity = org.city;
    body.orgState = org.state;
    // Ensure drive city matches org city
    if (!body.city) body.city = org.city;
    if (!body.state) body.state = org.state;

    const drive = await VolunteerDrive.create(body);
    return NextResponse.json(drive, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
