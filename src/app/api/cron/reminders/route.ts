import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { Issue } from "@/models/Issue";
import { VolunteerDrive } from "@/models/VolunteerDrive";
import { Notification } from "@/models/Notification";
import { TimelineEvent } from "@/models/TimelineEvent";
import { User } from "@/models/User";
import { logAudit } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const now = new Date();
    const actionsTaken: string[] = [];

    // 1. Fallback Logic: Check for issues in WAITING_FOR_ORG where the org hasn't responded for 48 hours
    const timeoutThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const staleIssues = await Issue.find({
      status: "WAITING_FOR_ORG",
      adoptedAreaId: { $exists: true },
      createdAt: { $lt: timeoutThreshold }
    });

    for (const issue of staleIssues) {
      // Re-assign to municipal employee
      const deptPrefix = (issue.assignedDepartment || "General").split(' ')[0].replace(/s$/i, '');
      const matchingStaff = await User.findOne({
        role: "employee",
        $or: [
          { state: { $regex: new RegExp(`^${(issue.location?.state || '').trim()}$`, 'i') } },
          { state: { $exists: false } }
        ],
        department: { $regex: new RegExp(deptPrefix, 'i') },
        isAvailable: { $ne: false }
      });

      issue.status = "Assigned";
      if (matchingStaff) {
        issue.assignedTo = matchingStaff._id;
        issue.assignedToName = matchingStaff.name;
      }
      
      await issue.save();

      await TimelineEvent.create({
        issueId: issue._id,
        action: "Fallback_To_Employee",
        actorName: "System AI",
        actorRole: "System",
        comment: `Adopted organization failed to respond within 48 hours. Auto-assigned to ${issue.assignedToName || 'municipal staff'}.`
      });

      await logAudit(
        "SMART_ROUTING_FALLBACK",
        "system",
        "system",
        issue._id.toString(),
        "Issue",
        { reason: "Org timeout 48h", newAssignee: issue.assignedToName },
        "SUCCESS"
      );

      if (matchingStaff) {
        await Notification.create({
          userId: matchingStaff.email,
          issueId: issue.issueId,
          type: "Assignment",
          title: "New Fallback Assignment",
          message: `An issue in an adopted area timed out and was reassigned to you: ${issue.issueId}`
        });
      }

      actionsTaken.push(`Fallback applied to Issue ${issue.issueId}`);
    }

    // 2. Drive Reminders (7 Days, 3 Days, 1 Day, 2 Hours)
    // Here we would find VolunteerDrives that have upcoming dates matching exactly those windows, 
    // and send notifications to all confirmed volunteers.
    // For brevity, we simulate the structure:
    
    // Example: Find drives 1 day from now
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const drives1Day = await VolunteerDrive.find({
      date: { 
        $gte: new Date(oneDayFromNow.setHours(0,0,0,0)), 
        $lte: new Date(oneDayFromNow.setHours(23,59,59,999)) 
      },
      status: { $in: ["ORG_APPROVED", "DRIVE_IN_PROGRESS"] }
    });

    for (const drive of drives1Day) {
      if (drive.volunteers && drive.volunteers.length > 0) {
        for (const vol of drive.volunteers) {
          if (vol.status === "approved" && vol.email) {
            await Notification.create({
              userId: vol.email,
              type: "Drive_Reminder",
              title: "Upcoming Community Drive Tomorrow",
              message: `Reminder: The drive "${drive.title}" is happening tomorrow. Please check the drive page for any recent announcements.`
            });
          }
        }
      }
      actionsTaken.push(`Sent 1-Day reminder for Drive ${drive._id}`);
    }

    return NextResponse.json({ success: true, actions: actionsTaken });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
