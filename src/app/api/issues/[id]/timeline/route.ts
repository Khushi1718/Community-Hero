import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { Issue } from "@/models/Issue";
import { TimelineEvent } from "@/models/TimelineEvent";

type Props = { params: Promise<{ id: string }> };

/**
 * GET /api/issues/[id]/timeline
 * Role-filtered timeline. Citizens only see isPublic=true events.
 */
export async function GET(request: NextRequest, props: Props) {
  try {
    const { id } = await props.params;
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "citizen";

    const issueQuery = id.startsWith("CH-") ? { issueId: id } : { _id: id };
    const issue = await Issue.findOne(issueQuery).select("_id issueId");
    if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });

    const timelineQuery: any = { issueId: issue._id };
    if (role === "citizen") timelineQuery.isPublic = true;

    const events = await TimelineEvent.find(timelineQuery).sort({ timestamp: 1 });

    return NextResponse.json(events.map(e => ({
      _id: e._id,
      action: e.action,
      comment: e.comment,
      actorName: e.actorName,
      actorRole: e.actorRole,
      isPublic: e.isPublic,
      progressPercentage: e.progressPercentage,
      attachments: e.attachments || [],
      evidenceCategory: e.evidenceCategory,
      timestamp: e.timestamp,
    })));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
