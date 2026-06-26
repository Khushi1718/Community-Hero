import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { Issue } from "@/models/Issue";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";

// This would typically be protected by a cron secret in production
export async function GET() {
  try {
    await connectToDatabase();

    const now = Date.now();
    
    // Find issues that are overdue and haven't been flagged yet
    // Exclude issues that are already completed, resolved, rejected, or closed.
    const overdueIssues = await Issue.find({
      expectedCompletionTime: { $lt: new Date(now) },
      isOverdue: false,
      status: { $nin: ["Completed", "Resolved", "Rejected", "Closed"] }
    });

    let escalatedCount = 0;

    for (const issue of overdueIssues) {
      issue.isOverdue = true;

      // Escalate priority
      if (issue.priority === "P3_Medium") {
        issue.priority = "P2_High";
      } else if (issue.priority === "P2_High") {
        issue.priority = "P1_Critical";
      }

      await issue.save();
      escalatedCount++;

      // Notify Assigned Employee
      if (issue.assignedTo) {
        const employee = await User.findById(issue.assignedTo);
        if (employee) {
          await Notification.create({
            userId: employee.email,
            issueId: issue.issueId,
            title: "SLA Breached - Issue Overdue",
            message: `The SLA deadline for ${issue.issueId} has passed. Please address this immediately.`,
            type: "System"
          });
        }
      }

      // Escalate to Admin
      if (issue.assignedAdmin) {
        const admin = await User.findById(issue.assignedAdmin);
        if (admin) {
          await Notification.create({
            userId: admin.email,
            issueId: issue.issueId,
            title: "Escalation: Employee Overdue",
            message: `Issue ${issue.issueId} assigned to ${issue.assignedToName || "an employee"} has breached its SLA.`,
            type: "System"
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cron ran successfully. Escalated ${escalatedCount} overdue issues.`
    });

  } catch (error: any) {
    console.error("Cron SLA Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
