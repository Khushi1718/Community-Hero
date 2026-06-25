import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { CommunityPost } from "@/models/CommunityPost";

type Props = { params: Promise<{ id: string }> };

/**
 * POST /api/community/[id]/like
 * Toggles a like for a community post.
 * Body: { userId: string }
 * Returns: { liked: boolean, likeCount: number }
 */
export async function POST(request: NextRequest, props: Props) {
  try {
    const { id } = await props.params;
    await connectToDatabase();

    const body = await request.json();
    const userId = body.userId || "anonymous";

    const post = await CommunityPost.findById(id);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const existingLikeIndex = post.likes.findIndex((l: any) => l.userId === userId);
    let liked: boolean;

    if (existingLikeIndex >= 0) {
      // Unlike
      post.likes.splice(existingLikeIndex, 1);
      liked = false;
    } else {
      // Like
      post.likes.push({ userId, createdAt: new Date() });
      liked = true;
    }

    post.upvotes = post.likes.length;
    await post.save();

    return NextResponse.json({ liked, likeCount: post.likes.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
