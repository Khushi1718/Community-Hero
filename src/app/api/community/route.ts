import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { CommunityPost } from "@/models/CommunityPost";
import { Issue } from "@/models/Issue";
import { VolunteerDrive } from "@/models/VolunteerDrive";
import { VolunteerOrganization } from "@/models/VolunteerOrganization";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");
    const city = searchParams.get("city");
    const department = searchParams.get("department");
    const statsOnly = searchParams.get("statsOnly") === "true";

    if (statsOnly) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Real aggregate stats from MongoDB
      const [
        totalResolved, 
        totalIssues, 
        posts, 
        totalDrives, 
        verifiedOrgs, 
        users,
        resolvedThisMonth,
        issuesThisMonth,
        drivesThisMonth,
        orgsThisMonth
      ] = await Promise.all([
        Issue.countDocuments({ status: "Closed" }),
        Issue.countDocuments({}),
        CommunityPost.find({}).select("resolutionTimeHours department").lean(),
        VolunteerDrive.countDocuments({}),
        VolunteerOrganization.countDocuments({ status: "VERIFIED" }),
        User.find({ "communityInfo.volunteerHours": { $gt: 0 } }).select("communityInfo").lean(),
        Issue.countDocuments({ status: "Closed", $or: [{ resolvedAt: { $gte: thirtyDaysAgo } }, { updatedAt: { $gte: thirtyDaysAgo } }] }),
        Issue.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        VolunteerDrive.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        VolunteerOrganization.countDocuments({ status: "VERIFIED", createdAt: { $gte: thirtyDaysAgo } })
      ]);

      const avgResolutionHours = posts.length > 0
        ? Math.round(posts.reduce((sum: number, p: any) => sum + (p.resolutionTimeHours || 24), 0) / posts.length)
        : 0;

      const deptCounts: Record<string, number> = {};
      posts.forEach((p: any) => { if (p.department) deptCounts[p.department] = (deptCounts[p.department] || 0) + 1; });
      const topDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
      
      const totalVolunteerHours = users.reduce((sum: number, u: any) => sum + (u.communityInfo?.volunteerHours || 0), 0);
      const activeVolunteers = users.length;

      return NextResponse.json({
        totalResolved,
        totalIssues,
        avgResolutionHours,
        topDepartment: topDept,
        totalDrives,
        verifiedOrgs,
        totalVolunteerHours,
        activeVolunteers,
        resolvedThisMonth,
        issuesThisMonth,
        drivesThisMonth,
        orgsThisMonth
      });
    }

    let query: any = {};
    if (state) query["location.state"] = { $regex: new RegExp(`^${state.trim()}$`, 'i') };
    if (city) query["location.city"] = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
    if (department) query.department = { $regex: new RegExp(department.trim(), 'i') };
    
    const postType = searchParams.get("postType");
    if (postType) query.postType = postType;

    const sortParam = searchParams.get("sort") || "Latest";
    let sortObj: any = { resolvedAt: -1 };
    if (sortParam === "Most Liked") sortObj = { "likes.length": -1, upvotes: -1 };
    else if (sortParam === "Most Impactful") sortObj = { "impactMetrics.volunteerHours": -1 };

    const posts = await CommunityPost.find(query)
      .sort(sortObj)
      .limit(50)
      .lean();

    // Increment view counts (fire-and-forget)
    CommunityPost.updateMany(
      { _id: { $in: posts.map((p: any) => p._id) } },
      { $inc: { views: 1 } }
    ).catch(() => {});

    return NextResponse.json(posts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { action, postId } = body;
    const now = new Date();

    const post = await CommunityPost.findById(postId);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    switch (action) {
      case "bookmark": {
        const { userId } = body; // email or id
        const existingIdx = post.bookmarks?.findIndex(b => b.userId === userId);
        if (existingIdx !== undefined && existingIdx > -1) {
          post.bookmarks.splice(existingIdx, 1);
        } else {
          post.bookmarks = post.bookmarks || [];
          post.bookmarks.push({ userId });
        }
        await post.save();
        return NextResponse.json(post);
      }
      
      case "report_comment": {
        const { commentId, reportedBy } = body;
        const comment = post.comments?.find((c: any) => c._id && c._id.toString() === commentId);
        if (comment) {
           comment.reportedBy = comment.reportedBy || [];
           if (!comment.reportedBy.includes(reportedBy)) {
               comment.reportedBy.push(reportedBy);
           }
           await post.save();
           return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
      }

      case "request_correction": {
        const { details } = body;
        post.correctionRequest = {
            requestedAt: now,
            details,
            status: "pending"
        };
        await post.save();
        return NextResponse.json(post);
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
