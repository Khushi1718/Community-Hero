import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { CommunityPost } from "@/models/CommunityPost";

type Props = { params: Promise<{ id: string }> };

/**
 * POST /api/community/[id]/comment
 * Adds a comment to a community post.
 * Body: { userId, userName, text }
 */
export async function POST(request: NextRequest, props: Props) {
  try {
    const { id } = await props.params;
    await connectToDatabase();

    const { userId, userName, text } = await request.json();
    if (!text?.trim()) return NextResponse.json({ error: "Comment text required" }, { status: 400 });

    const post = await CommunityPost.findById(id);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    post.comments.push({
      userId: userId || "anonymous",
      userName: userName || "Community Member",
      text: text.trim(),
      createdAt: new Date()
    });
    await post.save();

    return NextResponse.json({ success: true, commentCount: post.comments.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/community/[id]/comment
 * Returns all comments for a post.
 */
export async function GET(request: NextRequest, props: Props) {
  try {
    const { id } = await props.params;
    await connectToDatabase();

    const post = await CommunityPost.findById(id).select("comments");
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    return NextResponse.json(post.comments.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
