import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { VolunteerOrganization } from "@/models/VolunteerOrganization";
import { Notification } from "@/models/Notification";

/**
 * GET /api/volunteer-org
 * List organizations, filterable by status, city, state, assignedAdmin
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const assignedAdmin = searchParams.get("assignedAdmin");
    const id = searchParams.get("id");

    const query: any = {};
    if (status) query.status = status;
    if (city) query.city = { $regex: new RegExp(`^${city.trim()}$`, "i") };
    if (state) query.state = { $regex: new RegExp(`^${state.trim()}$`, "i") };
    if (assignedAdmin) query.assignedAdmin = assignedAdmin;
    if (id) query._id = id;

    const orgs = await VolunteerOrganization.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    return NextResponse.json(orgs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/volunteer-org
 * Register a new volunteer organization (status = PENDING_VERIFICATION)
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Normalize email
    if (body.contactEmail) {
      body.contactEmail = body.contactEmail.toLowerCase().trim();
    }

    // Check for duplicate email
    const existing = await VolunteerOrganization.findOne({
      contactEmail: body.contactEmail,
    });
    if (existing) {
      return NextResponse.json(
        { error: "An organization with this contact email already exists." },
        { status: 409 }
      );
    }

    // Admin creation vs Self-registration
    if (body.createdByAdmin) {
      body.status = "VERIFIED";
      body.mustChangePassword = true;
      body.username = `ORG-${Math.floor(10000 + Math.random() * 90000)}`;
      body.verifiedBy = body.adminName;
      body.verifiedByRole = body.adminRole;
      body.verifiedAt = new Date();
      body.creatorInfo = `Admin: ${body.adminEmail}`;
      body.trustScore = 50;
      body.verificationHistory = [{
        action: "approved",
        actorEmail: body.adminEmail,
        actorName: body.adminName,
        actorRole: body.adminRole,
        message: "Organization created directly by Admin",
        timestamp: new Date()
      }];
    } else {
      // Self registration
      body.status = "PENDING_VERIFICATION";
      body.trustScore = 50;
      body.verificationHistory = [];
    }

    const org = await VolunteerOrganization.create(body);
    const orgObj = org.toObject();
    
    // In dev/demo, we return the password if created by admin so the UI can show the modal
    if (!body.createdByAdmin) {
      delete (orgObj as any).password;
    }

    // Send system notification
    if (body.createdByAdmin) {
      await Notification.create({
        userId: org.contactEmail, orgId: org._id.toString(), type: "Org_Verification",
        title: "Organization Account Created",
        message: `Your organization account has been created by ${body.adminName}. Please login using your temporary credentials.`
      });
    } else {
      await Notification.create({
        userId: org.contactEmail, orgId: org._id.toString(), type: "Org_Verification",
        title: "Registration Submitted",
        message: `Your organization "${org.name}" is pending admin verification.`,
      });
    }

    return NextResponse.json(orgObj, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
