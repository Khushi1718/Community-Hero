import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { Issue } from "@/models/Issue";
import { TimelineEvent } from "@/models/TimelineEvent";

// Secret header expected from the external CRM for security
const CRM_WEBHOOK_SECRET = process.env.CRM_WEBHOOK_SECRET || "default_dev_secret_change_in_prod";

export async function POST(request: NextRequest) {
  try {
    // 1. Validate Secret
    const authHeader = request.headers.get("authorization") || request.headers.get("x-crm-signature");
    if (authHeader !== `Bearer ${CRM_WEBHOOK_SECRET}` && authHeader !== CRM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { ticket_id, status, note, actor } = body;

    if (!ticket_id || !status) {
      return NextResponse.json({ error: "ticket_id and status are required" }, { status: 400 });
    }

    // 2. Find internal ticket
    // ticket_id might be the issueId (CH-2026-1234) or the MongoDB ObjectId
    const isObjectId = /^[a-f0-9]{24}$/.test(ticket_id);
    const query = isObjectId ? { _id: ticket_id } : { issueId: ticket_id };
    
    const issue = await Issue.findOne(query);

    if (!issue) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // 3. Update status if valid
    const validStatuses = ["Reported", "Open", "Assigned", "In Progress", "WAITING_FOR_ORG", "Resolved", "Closed", "Rejected", "Overridden"];
    
    // Map external statuses to internal if necessary (basic mapping here)
    let internalStatus = status;
    if (!validStatuses.includes(status)) {
        // Fallback or explicit mapping could be done here. For now, assume strict matching.
        console.warn(`External CRM sent unknown status: ${status} for ticket ${ticket_id}. Attempting to apply anyway.`);
    }

    issue.status = internalStatus;
    
    if (internalStatus === "Resolved" || internalStatus === "Closed") {
      issue.progressPercentage = 100;
    }

    await issue.save();

    // 4. Create a Timeline Event to trigger citizen notifications
    await TimelineEvent.create({
      issueId: issue._id,
      action: "Status_Changed",
      actorName: actor || "External CRM",
      actorRole: "system",
      isPublic: true,
      comment: note ? `Status updated to ${internalStatus}. Note: ${note}` : `Status automatically updated to ${internalStatus} via CRM Sync.`,
      progressPercentage: issue.progressPercentage
    });

    return NextResponse.json({ success: true, message: "Status updated successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("CRM Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
