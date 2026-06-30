import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { VolunteerOrganization } from "@/models/VolunteerOrganization";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import { logAudit, checkPermission, PERMISSIONS } from "@/lib/permissions";

/**
 * GET /api/volunteer-org/[id]
 * Fetch a single organization by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const org = await VolunteerOrganization.findById(id).select("-password");
    if (!org) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    return NextResponse.json(org);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/volunteer-org/[id]
 * Update an organization. Handles:
 * - Admin verification (approve/reject/suspend/reactivate/info_requested)
 * - Profile updates from org
 * - Trust score adjustments
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    const org = await VolunteerOrganization.findById(id);
    if (!org) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    const {
      action,
      actorEmail,
      actorName,
      actorRole,
      message,
      // Profile fields
      name,
      description,
      mission,
      contactPersonName,
      contactPhone,
      website,
      logoUrl,
      coverImageUrl,
      workCategories,
      workingAreas,
      gallery,
      address,
      // Trust score
      trustScoreDelta,
      trustScore,
    } = body;

    // --- Admin verification actions ---
    const adminActions = ["approved", "rejected", "suspended", "reactivated", "info_requested"];
    if (action && adminActions.includes(action)) {
      const historyEntry = {
        action,
        actorEmail: actorEmail || "system",
        actorName: actorName || "System",
        actorRole: actorRole || "admin",
        message: message || undefined,
        timestamp: new Date(),
      };

      let notifTitle = "";
      let notifMessage = "";
      let notifType: any = "Org_Verification";

      switch (action) {
        case "approved":
          org.status = "VERIFIED";
          // Prompt 2 - Credentials & Verification info
          org.mustChangePassword = true;
          org.verifiedBy = actorName || "System";
          org.verifiedByRole = actorRole || "admin";
          org.verifiedAt = new Date();
          // Generate username on first approval if not exists
          if (!org.username) {
            org.username = `ORG-${Math.floor(10000 + Math.random() * 90000)}`;
          }

          notifTitle = "Organization Verified! 🎉";
          notifMessage = `Congratulations! Your organization "${org.name}" has been verified. You can now access the full dashboard and receive community drives.`;
          break;
        case "rejected":
          org.status = "REJECTED";
          org.rejectionReason = message || "No reason provided.";
          notifTitle = "Organization Verification Rejected";
          notifMessage = `Your organization "${org.name}" was not approved. Reason: ${message || "No reason provided."}`;
          break;
        case "suspended":
          org.status = "SUSPENDED";
          notifTitle = "Organization Suspended";
          notifMessage = `Your organization "${org.name}" has been suspended. Reason: ${message || "No reason provided."}. Contact the administrator for more information.`;
          
          // Prompt 2 - Handle active drives on suspension
          const { VolunteerDrive } = await import("@/models/VolunteerDrive");
          const activeDrives = await VolunteerDrive.find({
            acceptedOrgId: org._id,
            status: { $in: ["ORG_APPROVED", "VOLUNTEER_REG_OPEN", "REG_CLOSED", "DRIVE_IN_PROGRESS"] }
          });

          for (const drive of activeDrives) {
             if (drive.createdByAdmin) {
                 await Notification.create({
                     userId: drive.createdByAdmin, orgId: org._id.toString(), type: "Org_Suspended_Mid_Drive",
                     title: "Action Required: Assigned Org Suspended",
                     message: `Organization "${org.name}" managing drive "${drive.title}" was suspended. Please reassign the drive or restore the employee assignment.`
                 });
             }
          }
          break;
        case "reactivated":
          org.status = "VERIFIED";
          notifTitle = "Organization Reactivated";
          notifMessage = `Your organization "${org.name}" has been reactivated and you can now access the dashboard again.`;
          break;
        case "info_requested":
          org.adminMessage = message || "";
          notifTitle = "Additional Information Requested";
          notifMessage = `The admin has requested more information about your organization "${org.name}". Message: ${message}`;
          break;

        default:
          return NextResponse.json({ error: "Invalid action." }, { status: 400 });
      }

      org.verificationHistory.push(historyEntry as any);
      await org.save();

      // Log the action using the immutable audit logger
      await logAudit(
        `ORG_${action.toUpperCase()}`,
        actorEmail || "system",
        actorRole || "admin",
        org._id.toString(),
        "VolunteerOrganization",
        { orgName: org.name, reason: message },
        "SUCCESS"
      );

      // System notification
      await Notification.create({
        userId: org.contactEmail,
        orgId: org._id.toString(),
        type: notifType,
        title: notifTitle,
        message: notifMessage,
      });

      return NextResponse.json({ message: `Organization ${action} successfully.`, org });
    }

    // --- Membership Actions ---
    if (action === "join_org") {
       const { name, phone, email, age, skills, availability, motivation, userId } = body;
       org.members = org.members || [];
       
       const exists = org.members.find(m => m.email === email || (userId && m.userId === userId));
       if (exists) {
           return NextResponse.json({ error: "You have already applied or belong to this organization." }, { status: 400 });
       }
       
       let previousDrives = 0;
       let previousHours = 0;
       let attendancePercentage = 100;
       if (userId) {
           const citizen = await User.findOne({ email: userId });
           if (citizen && citizen.communityInfo) {
               previousDrives = citizen.communityInfo.completedDrives || 0;
               previousHours = citizen.communityInfo.volunteerHours || 0;
               attendancePercentage = citizen.communityInfo.attendancePercentage || 100;
           }
       }
       
       org.members.push({
           name, phone, email, age, skills, availability, motivation, userId,
           status: "pending", joinedAt: new Date(),
           previousDrives, previousHours, attendancePercentage
       });
       
       await Notification.create({
           userId: org.contactEmail, orgId: org._id.toString(), type: "Org_Membership_Request",
           title: "New Membership Request",
           message: `${name} has applied to join your organization.`
       });
       
       await Notification.create({
           userId: userId || email, type: "System",
           title: "Membership Request Sent",
           message: `Your request to join ${org.name} has been sent successfully.`
       });
       
       await org.save();
       return NextResponse.json({ success: true });
    }

    if (action === "approve_member") {
       const { email } = body;
       const member = org.members?.find(m => m.email === email);
       if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
       member.status = "member";
       org.activeMembers = (org.activeMembers || 0) + 1;
       
       if (member.userId) {
           await User.updateOne(
               { email: member.userId },
               { $inc: { "communityInfo.organizationsJoined": 1 } }
           );
       }
       
       await Notification.create({
           userId: member.userId || member.email, type: "System",
           title: "Membership Approved 🎉",
           message: `Welcome! You are now a member of ${org.name}.`
       });
       await org.save();
       return NextResponse.json({ success: true });
    }

    if (action === "reject_member") {
       const { email } = body;
       const member = org.members?.find(m => m.email === email);
       if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
       member.status = "rejected";
       
       await Notification.create({
           userId: member.userId || member.email, type: "System",
           title: "Membership Request Not Approved",
           message: `Your request to join ${org.name} was not approved.`
       });
       await org.save();
       return NextResponse.json({ success: true });
    }

    if (action === "remove_member") {
       const { email } = body;
       const member = org.members?.find(m => m.email === email);
       if (member && member.status === "member") {
           org.activeMembers = Math.max(0, (org.activeMembers || 1) - 1);
       }
       org.members = org.members?.filter(m => m.email !== email) || [];
       
       if (member?.userId) {
           await User.updateOne(
               { email: member.userId },
               { $inc: { "communityInfo.organizationsJoined": -1 } }
           );
       }
       
       await Notification.create({
           userId: member?.userId || email, type: "System",
           title: "Membership Removed",
           message: `You are no longer a member of ${org.name}.`
       });
       await org.save();
       return NextResponse.json({ success: true });
    }
    
    // --- Announcement Actions ---
    if (action === "post_announcement") {
       const { title, message: annMessage, target, postedBy } = body;
       org.announcements = org.announcements || [];
       org.announcements.push({
           title, message: annMessage, target, postedBy, postedAt: new Date()
       });
       
       // Note: In a full system, you would iterate over targeted members/volunteers
       // and create a Notification document for each.
       
       await org.save();
       return NextResponse.json({ success: true });
    }

    // --- Profile updates ---
    if (name !== undefined) org.name = name;
    if (description !== undefined) org.description = description;
    if (mission !== undefined) org.mission = mission;
    if (contactPersonName !== undefined) org.contactPersonName = contactPersonName;
    if (contactPhone !== undefined) org.contactPhone = contactPhone;
    if (website !== undefined) org.website = website;
    if (logoUrl !== undefined) org.logoUrl = logoUrl;
    if (coverImageUrl !== undefined) org.coverImageUrl = coverImageUrl;
    if (workCategories !== undefined) org.workCategories = workCategories;
    if (workingAreas !== undefined) org.workingAreas = workingAreas;
    if (gallery !== undefined) org.gallery = gallery;
    if (address !== undefined) org.address = address;

    // --- Trust score ---
    if (trustScoreDelta !== undefined) {
      org.trustScore = Math.min(100, Math.max(0, org.trustScore + trustScoreDelta));
    }
    if (trustScore !== undefined) {
      org.trustScore = Math.min(100, Math.max(0, trustScore));
    }

    await org.save();
    const orgObj = org.toObject();
    delete (orgObj as any).password;

    return NextResponse.json(orgObj);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/volunteer-org/[id]
 * Super admin only — hard delete an organization
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    await VolunteerOrganization.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
