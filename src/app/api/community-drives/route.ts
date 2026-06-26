import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { VolunteerDrive, DriveStatus } from "@/models/VolunteerDrive";
import { Issue } from "@/models/Issue";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import { VolunteerOrganization } from "@/models/VolunteerOrganization";

/**
 * Helper to process lazy background tasks on drives (48h expiry, overdue, reminders)
 */
async function processDriveBackgroundChecks(drives: any[]) {
  const now = new Date();
  let updatedCount = 0;

  for (const drive of drives) {
    let needsSave = false;

    // 1. 48-Hour Expiry (WAITING_FOR_ORG)
    if (drive.status === "WAITING_FOR_ORG" && drive.expiresAt && now > new Date(drive.expiresAt)) {
      drive.status = "FAILED";
      drive.cancelReason = "No organization accepted the drive within 48 hours.";
      needsSave = true;

      // Restore employee on the issue
      if (drive.issueId) {
        const issue = await Issue.findOne({ issueId: drive.issueId });
        if (issue && issue.status === "Community Drive Active") {
          issue.status = "Assigned";
          issue.employeeHoldReason = undefined;
          issue.statusHistory.push({ status: "Assigned", timestamp: now, actorName: "System", actorRole: "system" });
          await issue.save();

          // Notify Admin
          if (issue.assignedAdminName) {
             const adm = await User.findOne({ name: issue.assignedAdminName }).select("email");
             if (adm) {
                 await Notification.create({
                     userId: adm.email, issueId: issue.issueId, type: "Drive_Failed",
                     title: "Community Drive Failed", 
                     message: `Drive "${drive.title}" failed because no organization accepted within 48 hours. Issue has been reassigned to employee.`
                 });
             }
          }
          // Notify Employee
          if (issue.assignedToName) {
              const emp = await User.findOne({ name: issue.assignedToName }).select("email");
              if (emp) {
                 await Notification.create({
                     userId: emp.email, issueId: issue.issueId, type: "System",
                     title: "Assignment Restored", 
                     message: `You have been reassigned to issue ${issue.issueId} because the community drive failed.`
                 });
              }
          }
        }
      }
    }

    // 2. Overdue Check (past date and not completed/cancelled)
    const activeStatuses = ["ORG_APPROVED", "VOLUNTEER_REG_OPEN", "REG_CLOSED", "DRIVE_IN_PROGRESS"];
    if (activeStatuses.includes(drive.status) && drive.date && drive.time) {
      // Parse drive datetime
      const driveDate = new Date(drive.date);
      // naive approach: just check if end of drive day has passed
      driveDate.setHours(23, 59, 59, 999); 
      
      if (now > driveDate) {
        drive.status = "OVERDUE";
        needsSave = true;

        // Penalize Org Trust Score
        if (drive.acceptedOrgId) {
          const org = await VolunteerOrganization.findById(drive.acceptedOrgId);
          if (org) {
             org.trustScore = Math.max(0, org.trustScore - 15);
             await org.save();
             await Notification.create({
                userId: org.contactEmail, orgId: org._id.toString(), type: "Drive_Overdue",
                title: "Drive Overdue (-15 Trust Score)",
                message: `Your drive "${drive.title}" has passed its scheduled date without completion. Your trust score has been penalized.`
             });
          }
        }
      }
    }

    if (needsSave) {
      await drive.save();
      updatedCount++;
    }
  }

  return updatedCount;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const orgId = searchParams.get("orgId");
    const issueId = searchParams.get("issueId");
    const role = request.headers.get("x-user-role");

    let query: any = {};
    if (city) query.city = { $regex: new RegExp(`^${city.trim()}$`, "i") };
    if (category) query.category = category;
    
    // Status filter — if an array is passed via multiple status params
    const statuses = searchParams.getAll("status");
    if (statuses.length > 0) {
       query.status = { $in: statuses };
    } else if (status) {
       query.status = status;
    }
    
    if (orgId) {
       // if orgId is provided, we might want drives they own OR drives they accepted
       query.$or = [
         { orgId: orgId }, 
         { acceptedOrgId: orgId }
       ];
    }
    if (issueId) query.issueId = issueId;

    const drives = await VolunteerDrive.find(query).sort({ createdAt: -1 });

    // Run lazy background checks
    await processDriveBackgroundChecks(drives);

    return NextResponse.json(drives);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    if (!body.issueId || !body.createdByAdmin) {
       return NextResponse.json({ error: "issueId and createdByAdmin are required" }, { status: 400 });
    }

    const issue = await Issue.findOne({ issueId: body.issueId });
    if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });

    if (["Travelling", "Reached Site", "Inspection Started", "Work Started", "Work In Progress", "Completed", "Closed"].includes(issue.status)) {
       return NextResponse.json({ error: "Cannot convert issue: Employee has already started work." }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const drive = await VolunteerDrive.create({
      issueId: issue.issueId,
      createdByAdmin: body.createdByAdmin,
      title: body.title,
      description: body.description,
      category: body.category,
      city: issue.location.city,
      state: issue.location.state,
      address: issue.location.address,
      date: new Date(body.date),
      time: body.time,
      durationHours: body.durationHours,
      requiredVolunteers: body.requiredVolunteers,
      maxVolunteers: body.maxVolunteers,
      instructions: body.instructions,
      meetingLocation: body.meetingLocation,
      requiredOrgCategory: body.requiredOrgCategory,
      status: "WAITING_FOR_ORG",
      expiresAt: expiresAt,
    });

    // Update issue
    issue.communityDriveId = drive._id.toString();
    issue.status = "Community Drive Active";
    issue.employeeHoldReason = "Community Drive Active";
    issue.statusHistory.push({ status: "Community Drive Active", timestamp: new Date(), actorName: body.createdByAdmin, actorRole: "admin" });
    await issue.save();

    // Notify Matching Orgs
    const matchingOrgs = await VolunteerOrganization.find({
       status: "VERIFIED",
       city: { $regex: new RegExp(`^${issue.location.city!.trim()}$`, "i") },
       workCategories: body.requiredOrgCategory
    });

    for (const org of matchingOrgs) {
       await Notification.create({
           userId: org.contactEmail,
           orgId: org._id.toString(),
           title: "New Community Drive Available",
           message: `A new drive "${drive.title}" in your area requires an organization like yours. Check your Available Drives tab.`,
           type: "Drive_Invitation"
       });
    }

    return NextResponse.json(drive, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
