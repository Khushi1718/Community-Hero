import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { Issue } from "@/models/Issue";
import { VolunteerDrive } from "@/models/VolunteerDrive";
import { VolunteerOrganization } from "@/models/VolunteerOrganization";
import { Notification } from "@/models/Notification";
import { checkPermission, PERMISSIONS } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const requesterRole = request.headers.get("x-user-role") || "citizen";
    await checkPermission(requesterRole, PERMISSIONS.CAN_VIEW_AUDIT_LOGS);

    const now = new Date();

    // 1. Failed Notifications (Not natively tracked, we'll track ones that are system errors or overdue read)
    const pendingNotificationsCount = await Notification.countDocuments({ isRead: false });

    // 2. AI Failures
    const aiFailureCount = await Issue.countDocuments({
      "aiAnalysis.isFake": true, // Using isFake as proxy for AI flagging/failure for now
    });

    // 3. Overdue Drives
    const overdueDrivesCount = await VolunteerDrive.countDocuments({
      date: { $lt: now },
      status: { $in: ["OPEN", "WAITING_FOR_ORG", "ORG_PENDING_APPROVAL", "ORG_APPROVED", "VOLUNTEER_REG_OPEN", "REG_CLOSED", "DRIVE_IN_PROGRESS"] },
    });

    // 4. Inactive Organizations (Not verified after 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const inactiveOrgsCount = await VolunteerOrganization.countDocuments({
      status: "PENDING_VERIFICATION",
      createdAt: { $lt: thirtyDaysAgo },
    });

    // 5. Unresolved Emergencies
    const unresolvedEmergenciesCount = await Issue.countDocuments({
      isEmergency: true,
      status: { $nin: ["Resolved", "Closed", "Rejected"] },
    });

    return NextResponse.json({
      pendingNotifications: pendingNotificationsCount,
      aiFailures: aiFailureCount,
      overdueDrives: overdueDrivesCount,
      inactiveOrganizations: inactiveOrgsCount,
      unresolvedEmergencies: unresolvedEmergenciesCount,
      lastUpdated: new Date()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
