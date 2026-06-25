import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { Notification } from "@/models/Notification";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, props: Props) {
  try {
    const { id } = await props.params;
    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const isRead = body.isRead !== undefined ? body.isRead : true;

    await Notification.findByIdAndUpdate(id, { isRead });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
