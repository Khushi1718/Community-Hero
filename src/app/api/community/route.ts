import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { CommunityPost } from "@/models/CommunityPost";
import { Issue } from "@/models/Issue";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");
    const city = searchParams.get("city");
    const department = searchParams.get("department");
    const statsOnly = searchParams.get("statsOnly") === "true";

    if (statsOnly) {
      // Real aggregate stats from MongoDB
      const [totalResolved, totalIssues, posts] = await Promise.all([
        Issue.countDocuments({ status: "Closed" }),
        Issue.countDocuments({}),
        CommunityPost.find({}).select("resolutionTimeHours department").lean()
      ]);

      const avgResolutionHours = posts.length > 0
        ? Math.round(posts.reduce((sum: number, p: any) => sum + (p.resolutionTimeHours || 24), 0) / posts.length)
        : 0;

      const deptCounts: Record<string, number> = {};
      posts.forEach((p: any) => { if (p.department) deptCounts[p.department] = (deptCounts[p.department] || 0) + 1; });
      const topDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

      return NextResponse.json({
        totalResolved,
        totalIssues,
        avgResolutionHours,
        topDepartment: topDept
      });
    }

    let query: any = {};
    if (state) query["location.state"] = { $regex: new RegExp(`^${state.trim()}$`, 'i') };
    if (city) query["location.city"] = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
    if (department) query.department = { $regex: new RegExp(department.trim(), 'i') };

    const posts = await CommunityPost.find(query)
      .sort({ resolvedAt: -1 })
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
