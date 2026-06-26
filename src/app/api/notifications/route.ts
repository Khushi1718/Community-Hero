import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { Notification } from "@/models/Notification";

// GET all notifications for a specific user or organization
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const orgId = searchParams.get("orgId");

    if (!userId && !orgId) {
      return NextResponse.json({ error: "userId or orgId is required" }, { status: 400 });
    }

    const query: any = {};
    if (userId) query.userId = userId;
    if (orgId) query.orgId = orgId;

    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    return NextResponse.json(notifications);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST a new notification
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const newNotification = await Notification.create(body);
    return NextResponse.json(newNotification, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
