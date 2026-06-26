import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { VolunteerDrive } from "@/models/VolunteerDrive";
import { Issue } from "@/models/Issue";
import { Notification } from "@/models/Notification";
import { VolunteerOrganization } from "@/models/VolunteerOrganization";
import { User } from "@/models/User";
import { CommunityPost } from "@/models/CommunityPost";
import { processDriveGamification } from "@/lib/gamification";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, props: Props) {
  try {
    const { id } = await props.params;
    await connectToDatabase();
    const drive = await VolunteerDrive.findById(id);
    if (!drive) return NextResponse.json({ error: "Drive not found" }, { status: 404 });
    return NextResponse.json(drive);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, props: Props) {
  try {
    const { id } = await props.params;
    await connectToDatabase();
    
    const drive = await VolunteerDrive.findById(id);
    if (!drive) return NextResponse.json({ error: "Drive not found" }, { status: 404 });

    const body = await request.json();
    const { action } = body;
    const now = new Date();

    switch (action) {
      case "org_accept": {
        const { orgId, orgName, trustScore, completedDrives, category, members, message } = body;
        if (drive.status !== "WAITING_FOR_ORG" && drive.status !== "ORG_PENDING_APPROVAL") {
            return NextResponse.json({ error: "Drive is no longer accepting organizations" }, { status: 400 });
        }
        
        // Prevent duplicate requests
        const existing = drive.orgRequests?.find(r => r.orgId.toString() === orgId);
        if (existing) return NextResponse.json({ error: "You have already requested this drive." }, { status: 400 });

        drive.orgRequests = drive.orgRequests || [];
        drive.orgRequests.push({
            orgId, orgName, trustScore, completedDrives, category, members,
            status: "pending", message, requestedAt: now
        });
        drive.status = "ORG_PENDING_APPROVAL";

        // Notify Admin
        if (drive.createdByAdmin) {
            const adminUser = await User.findOne({ email: drive.createdByAdmin });
            if (adminUser) {
                await Notification.create({
                    userId: adminUser.email, issueId: drive.issueId, type: "Drive_Org_Accepted",
                    title: "Organization Accepted Drive",
                    message: `${orgName} has requested to manage drive "${drive.title}". Please review.`
                });
            }
        }
        break;
      }
      
      case "org_decline": {
        const { orgId } = body;
        const req = drive.orgRequests?.find(r => r.orgId.toString() === orgId);
        if (req) {
            req.status = "declined";
            req.respondedAt = now;
        }
        break;
      }

      case "org_approve": {
        const { orgId, adminEmail } = body;
        const requestToApprove = drive.orgRequests?.find(r => r.orgId.toString() === orgId);
        if (!requestToApprove) return NextResponse.json({ error: "Request not found" }, { status: 404 });

        requestToApprove.status = "approved";
        requestToApprove.respondedAt = now;
        
        drive.acceptedOrgId = requestToApprove.orgId;
        drive.acceptedOrgName = requestToApprove.orgName;
        drive.orgApprovedAt = now;
        drive.status = "ORG_APPROVED";

        // Auto-reject others
        drive.orgRequests?.forEach(r => {
            if (r.orgId.toString() !== orgId && r.status === "pending") {
                r.status = "rejected";
                r.respondedAt = now;
                // Notify rejected orgs
                Notification.create({
                    userId: r.orgId.toString(), orgId: r.orgId.toString(), type: "Drive_Org_Rejected",
                    title: "Drive Assigned Elsewhere",
                    message: `Thank you for your interest. Drive "${drive.title}" has been assigned to another organization.`
                });
            }
        });

        // Notify approved org
        const approvedOrg = await VolunteerOrganization.findById(orgId);
        if (approvedOrg) {
             await Notification.create({
                 userId: approvedOrg.contactEmail, orgId: orgId, type: "Drive_Org_Approved",
                 title: "Drive Request Approved",
                 message: `Your request to manage "${drive.title}" was approved by the admin.`
             });
        }
        break;
      }

      case "org_reject": {
         const { orgId } = body;
         const req = drive.orgRequests?.find(r => r.orgId.toString() === orgId);
         if (req) {
             req.status = "rejected";
             req.respondedAt = now;
             
             // Notify rejected org
             const rejectedOrg = await VolunteerOrganization.findById(orgId);
             if (rejectedOrg) {
                 await Notification.create({
                     userId: rejectedOrg.contactEmail, orgId: orgId, type: "Drive_Org_Rejected",
                     title: "Drive Request Rejected",
                     message: `Your request to manage "${drive.title}" was declined by the admin.`
                 });
             }
         }
         // If no pending requests left, back to WAITING_FOR_ORG
         const hasPending = drive.orgRequests?.some(r => r.status === "pending");
         if (!hasPending && drive.status === "ORG_PENDING_APPROVAL") {
             drive.status = "WAITING_FOR_ORG";
         }
         break;
      }

      case "start_volunteer_reg": {
         if (drive.status !== "ORG_APPROVED") return NextResponse.json({ error: "Invalid status" }, { status: 400 });
         drive.status = "VOLUNTEER_REG_OPEN";
         break;
      }

      case "volunteer_join": {
         const { name, phone, email, age, emergencyContact, userId, reasonForJoining } = body;
         if (drive.status !== "VOLUNTEER_REG_OPEN") return NextResponse.json({ error: "Registration closed" }, { status: 400 });
         
         if (drive.maxVolunteers && drive.joinedVolunteers >= drive.maxVolunteers) {
            return NextResponse.json({ error: "Volunteer capacity reached." }, { status: 400 });
         }

         drive.volunteers = drive.volunteers || [];
         
         // Prevent duplicate requests
         const exists = drive.volunteers.find(v => v.email === email || (userId && v.userId === userId));
         if (exists) {
             return NextResponse.json({ error: "You have already requested to join this drive." }, { status: 400 });
         }

         // Fetch previous citizen stats if userId exists
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

         drive.volunteers.push({ 
             userId, name, phone, email, age, emergencyContact, 
             reasonForJoining, status: "pending", joinedAt: now,
             previousDrives, previousHours, attendancePercentage
         });

         // Notify Org of pending request
         const org = await VolunteerOrganization.findById(drive.acceptedOrgId);
         if (org) {
             await Notification.create({
                 userId: org.contactEmail, orgId: org._id.toString(), type: "Drive_Volunteer_Joined",
                 title: "New Volunteer Request",
                 message: `${name} has requested to join your drive "${drive.title}". Please review.`
             });
         }
         
         // Notify Citizen
         await Notification.create({
             userId: userId || email, type: "System",
             title: "Request Submitted",
             message: `Your request to join "${drive.title}" has been sent to the organization for approval.`
         });
         break;
      }
      
      case "volunteer_approve": {
         const { email } = body;
         const vol = drive.volunteers?.find(v => v.email === email);
         if (!vol) return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
         
         if (drive.maxVolunteers && drive.joinedVolunteers >= drive.maxVolunteers) {
             return NextResponse.json({ error: "Cannot approve, capacity reached." }, { status: 400 });
         }
         
         vol.status = "approved";
         drive.joinedVolunteers = (drive.joinedVolunteers || 0) + 1;
         
         // Check capacity post-approve
         if (drive.maxVolunteers && drive.joinedVolunteers >= drive.maxVolunteers) {
             drive.status = "REG_CLOSED";
         }
         
         await Notification.create({
             userId: vol.userId || vol.email, type: "System",
             title: "Congratulations! Request Approved",
             message: `You have been selected to volunteer for the drive "${drive.title}".`
         });
         break;
      }
      
      case "volunteer_reject": {
         const { email } = body;
         const vol = drive.volunteers?.find(v => v.email === email);
         if (!vol) return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
         
         vol.status = "rejected";
         
         await Notification.create({
             userId: vol.userId || vol.email, type: "System",
             title: "Request Not Selected",
             message: `Thank you for your interest. Unfortunately, your request to join "${drive.title}" was not selected.`
         });
         break;
      }

      case "volunteer_cancel": {
         const { email } = body;
         drive.volunteers = drive.volunteers?.filter(v => v.email !== email) || [];
         drive.joinedVolunteers = drive.volunteers.filter(v => v.status === "approved").length;
         
         // Reopen reg if it was closed due to capacity
         if (drive.status === "REG_CLOSED" && drive.maxVolunteers && drive.joinedVolunteers < drive.maxVolunteers) {
             drive.status = "VOLUNTEER_REG_OPEN";
         }
         break;
      }

      case "attendance_mark": {
         if (drive.isAttendanceLocked) return NextResponse.json({ error: "Attendance is locked" }, { status: 400 });
         const { email, attendance } = body;
         const vol = drive.volunteers?.find(v => v.email === email);
         if (vol) vol.attendance = attendance;
         break;
      }

      case "timeline_update": {
         const { milestone, note, imageUrl } = body;
         drive.driveTimeline = drive.driveTimeline || [];
         drive.driveTimeline.push({ milestone, note, imageUrl, postedAt: now });
         
         // Update status based on milestone if needed
         if (milestone === "Drive Started") drive.status = "DRIVE_IN_PROGRESS";
         break;
      }

      case "request_cancel": {
         const { reason, requestedBy } = body;
         drive.cancelReason = reason;
         drive.cancellationRequestedBy = requestedBy;
         // Notify admin
         if (drive.createdByAdmin) {
             await Notification.create({
                 userId: drive.createdByAdmin, issueId: drive.issueId, type: "Drive_Cancelled",
                 title: "Drive Cancellation Requested",
                 message: `Organization requested to cancel drive "${drive.title}". Reason: ${reason}`
             });
         }
         break;
      }

      case "approve_cancel": {
         drive.status = "CANCELLED";
         drive.cancellationApprovedAt = now;
         
         // Penalty
         if (drive.acceptedOrgId) {
             const org = await VolunteerOrganization.findById(drive.acceptedOrgId);
             if (org) {
                 org.trustScore = Math.max(0, org.trustScore - 10);
                 await org.save();
             }
         }

         // Restore Employee
         if (drive.issueId) {
            const issue = await Issue.findOne({ issueId: drive.issueId });
            if (issue) {
                issue.status = "Assigned";
                issue.employeeHoldReason = undefined;
                issue.statusHistory.push({ status: "Assigned", timestamp: now, actorName: "System", actorRole: "system" });
                await issue.save();
                
                if (issue.assignedToName) {
                    const emp = await User.findOne({ name: issue.assignedToName });
                    if (emp) {
                         await Notification.create({
                             userId: emp.email, issueId: issue.issueId, type: "System",
                             title: "Assignment Restored",
                             message: `Community drive was cancelled. You are reassigned to issue ${issue.issueId}.`
                         });
                    }
                }
            }
         }
         break;
      }

      case "drive_complete": {
         const { workPerformed, hoursWorked, totalVolunteersPresent, afterImageUrls, videoUrls, wasteCollected, treesPlanted, awarenessParticipants, additionalNotes } = body;
         drive.status = "ADMIN_VERIFICATION_PENDING";
         drive.workPerformed = workPerformed;
         drive.hoursWorked = hoursWorked;
         drive.totalVolunteersPresent = totalVolunteersPresent;
         drive.afterImageUrls = afterImageUrls || [];
         drive.videoUrls = videoUrls || [];
         drive.wasteCollected = wasteCollected;
         drive.treesPlanted = treesPlanted;
         drive.awarenessParticipants = awarenessParticipants;
         drive.additionalNotes = additionalNotes;
         drive.completedByOrgAt = now;

         if (drive.createdByAdmin) {
             await Notification.create({
                 userId: drive.createdByAdmin, issueId: drive.issueId, type: "Drive_Completed",
                 title: "Drive Completed - Needs Verification",
                 message: `Organization marked drive "${drive.title}" as complete. Please verify.`
             });
         }
         break;
      }

      case "admin_verify": {
         drive.status = "VERIFIED";
         drive.completedAt = now;
         drive.isAttendanceLocked = true; // Lock attendance

         // Trust score +5
         let orgData = null;
         if (drive.acceptedOrgId) {
             const org = await VolunteerOrganization.findById(drive.acceptedOrgId);
             if (org) {
                 org.trustScore = Math.min(100, org.trustScore + 5);
                 org.completedDrivesCount = (org.completedDrivesCount || 0) + 1;
                 await org.save();
                 orgData = org;
                 
                 // Notify Org
                 await Notification.create({
                    userId: org.contactEmail, orgId: org._id.toString(), type: "Org_Completion_Approved",
                    title: "Drive Completion Verified",
                    message: `Admin has verified the completion of "${drive.title}". A Community Story has been published.`
                 });
             }
         }

         let issue = null;
         let beforeImageUrls: string[] = [];
         
         // Create community post if tied to an issue
         if (drive.issueId && !drive.isSelfInitiated) {
             issue = await Issue.findOne({ issueId: drive.issueId });
             if (issue) {
                 issue.status = "Closed";
                 issue.resolvedAt = now;
                 issue.employeeHoldReason = undefined;
                 issue.statusHistory.push({ status: "Closed", timestamp: now, actorName: "Admin", actorRole: "admin" });
                 await issue.save();
                 if (issue.imageUrl) beforeImageUrls.push(issue.imageUrl); // Force original citizen media
             }
         }

         const post = await CommunityPost.create({
            postType: drive.isSelfInitiated ? "Self_Initiated" : "Issue_Based",
            issueId: issue?.issueId,
            issueRef: issue?._id,
            driveId: drive._id,
            orgId: orgData?._id,
            orgName: orgData?.name || drive.acceptedOrgName || "Volunteer Organization",
            orgLogoUrl: orgData?.logoUrl,
            title: `Community Drive: ${drive.title}`,
            category: issue?.aiAnalysis?.category || drive.category,
            beforeImageUrls: beforeImageUrls,
            afterImageUrls: drive.afterImageUrls,
            videoUrls: drive.videoUrls,
            location: { address: drive.address, city: drive.city, state: drive.state },
            department: "Community Volunteer",
            reportedByName: issue?.isPublicRecognitionEnabled ? issue.reportedByName : "A Community Hero Citizen",
            resolvedByName: orgData?.name || drive.acceptedOrgName || "Volunteer Organization",
            resolutionSummary: drive.workPerformed || "Issue resolved by community volunteers.",
            reportedAt: issue?.createdAt || drive.createdAt,
            resolvedAt: now,
            completedAt: now,
            verificationStatus: "Verified",
            impactMetrics: {
               volunteerCount: drive.totalVolunteersPresent,
               volunteerHours: drive.hoursWorked,
               wasteCollected: drive.wasteCollected,
               treesPlanted: drive.treesPlanted,
               awarenessParticipants: drive.awarenessParticipants
            }
         });
         
         // Trigger Gamification Engine
         await processDriveGamification(drive);
         
         // Timeline update
         drive.driveTimeline = drive.driveTimeline || [];
         drive.driveTimeline.push({ milestone: "Community Story Published", note: `Post ${post._id} generated.`, postedAt: now });
         break;
      }
      
      case "admin_reassign_suspended": {
          // If org gets suspended, admin can reset drive back to WAITING_FOR_ORG
          drive.status = "WAITING_FOR_ORG";
          drive.acceptedOrgId = undefined;
          drive.acceptedOrgName = undefined;
          drive.orgRequests = [];
          
          if (drive.issueId) {
             const issue = await Issue.findOne({ issueId: drive.issueId });
             if (issue) {
                 issue.employeeHoldReason = "Community Drive Active"; 
             }
          }
          break;
      }
      
      case "admin_restore_employee_suspended": {
          // If org gets suspended, admin can cancel drive and restore employee
          drive.status = "FAILED";
          drive.cancelReason = "Organization suspended mid-drive. Employee restored.";
          
          if (drive.issueId) {
             const issue = await Issue.findOne({ issueId: drive.issueId });
             if (issue) {
                issue.status = "Assigned";
                issue.employeeHoldReason = undefined;
                issue.statusHistory.push({ status: "Assigned", timestamp: now, actorName: "System", actorRole: "system" });
                await issue.save();
             }
          }
          break;
      }

      default:
         return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await drive.save();
    return NextResponse.json(drive);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
