import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { Issue } from "@/models/Issue";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import { GoogleGenerativeAI } from "@google/generative-ai";
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
      let activeWorkload = 0;
      let employeeEmail = null;

      if (issue.assignedTo) {
        const employee = await User.findById(issue.assignedTo);
        if (employee) {
          employeeEmail = employee.email;
          activeWorkload = await Issue.countDocuments({
            assignedTo: issue.assignedTo,
            status: { $in: ["Assigned", "In Progress", "Work Started", "Site Visit Scheduled"] }
          });
        }
      }

      // Dynamic AI Decision
      let action = "ESCALATE_ADMIN";
      let reasoning = "Default fallback";

      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== "your_gemini_api_key" && apiKey !== "your_gemini_api_key_here") {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            }
          });

          const prompt = `You are a Municipal Escalation AI. An issue has breached its SLA.
Issue Title/Category: "${issue.title}"
Issue Severity/Priority: "${issue.priority}"
Employee Active Workload: ${activeWorkload} active tasks.

Based on these factors, decide the best escalation action:
1. "NUDGE": Send a reminder. Best if employee has low workload (<3 tasks) or issue is P3_Medium.
2. "ESCALATE_ADMIN": Escalate to admin and increase priority. Best if issue is P1_Critical or employee is heavily overloaded (>5 tasks).
3. "SUGGEST_ORG": Route to volunteer orgs. Best if issue is low priority and employee is overloaded.

Respond ONLY with a valid JSON object:
{
  "action": "NUDGE" | "ESCALATE_ADMIN" | "SUGGEST_ORG",
  "reasoning": "Brief explanation of why this action was chosen."
}`;
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          const parsed = JSON.parse(responseText);
          if (parsed.action && ["NUDGE", "ESCALATE_ADMIN", "SUGGEST_ORG"].includes(parsed.action)) {
            action = parsed.action;
            reasoning = parsed.reasoning || "";
          }
        } catch (e) {
          console.error("AI Escalation Error:", e);
        }
      }

      console.log(`[SLA Cron] Issue ${issue.issueId} AI Action: ${action} - ${reasoning}`);

      if (action === "ESCALATE_ADMIN") {
        if (issue.priority === "P3_Medium") issue.priority = "P2_High";
        else if (issue.priority === "P2_High") issue.priority = "P1_Critical";

        if (issue.assignedAdmin) {
          const admin = await User.findById(issue.assignedAdmin);
          if (admin) {
            await Notification.create({
              userId: admin.email,
              issueId: issue.issueId,
              title: "AI Escalation: Employee Overdue",
              message: `Issue ${issue.issueId} breached SLA. AI escalated because: ${reasoning}`,
              type: "System"
            });
          }
        }
        if (employeeEmail) {
           await Notification.create({
             userId: employeeEmail,
             issueId: issue.issueId,
             title: "SLA Breached - Escalated to Admin",
             message: `The SLA deadline for ${issue.issueId} has passed and it was escalated to admin.`,
             type: "System"
           });
        }
      } else if (action === "NUDGE") {
        if (employeeEmail) {
          await Notification.create({
            userId: employeeEmail,
            issueId: issue.issueId,
            title: "SLA Breached - Friendly Nudge",
            message: `Issue ${issue.issueId} is overdue. AI suggestion: ${reasoning}. Please address soon.`,
            type: "System"
          });
        }
      } else if (action === "SUGGEST_ORG") {
        issue.status = "WAITING_FOR_ORG";
        issue.assignedTo = undefined;
        issue.assignedToName = undefined;
        if (issue.assignedAdmin) {
          const admin = await User.findById(issue.assignedAdmin);
          if (admin) {
            await Notification.create({
              userId: admin.email,
              issueId: issue.issueId,
              title: "AI Re-routed to Orgs",
              message: `Issue ${issue.issueId} was re-routed to Volunteer Orgs because: ${reasoning}`,
              type: "System"
            });
          }
        }
      }

      await issue.save();
      escalatedCount++;
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
