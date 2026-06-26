import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { CommunityPost } from "@/models/CommunityPost";
import { VolunteerDrive } from "@/models/VolunteerDrive";
import { Issue } from "@/models/Issue";

type Props = { params: Promise<{ id: string }> };

export async function GET(
  req: NextRequest,
  props: Props
) {
  try {
    await connectToDatabase();
    const { id } = await props.params;
    
    const post = await CommunityPost.findById(id).lean();
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Increment views safely without triggering validation if unnecessary
    await CommunityPost.updateOne({ _id: id }, { $inc: { views: 1 } });

    // Fetch related drive and issue for timeline if applicable
    let drive = null;
    let issue = null;

    if (post.postType === "Issue_Based" || post.postType === "Municipal_Success") {
      issue = await Issue.findById(post.issueId).lean();
    }

    if (post.postType === "Issue_Based" || post.postType === "Self_Initiated") {
      // Find drive by issueId or if there is a direct reference (currently issueId is used to link them in Issue_Based)
      // Actually VolunteerDrive has issueId
      if (post.issueId) {
        drive = await VolunteerDrive.findOne({ issueId: post.issueId }).lean();
      } else {
         // self initiated might not have issueId, but the schema says issueId is required. 
         // Let's assume it has one or none.
      }
    }

    return NextResponse.json({
       ...post,
       views: (post.views || 0) + 1,
       relatedIssue: issue,
       relatedDrive: drive,
    });
  } catch (error: any) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
