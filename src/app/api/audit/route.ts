import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import AuditLog from "@/models/AuditLog";
import { checkPermission, PERMISSIONS } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // We expect the requester role to be passed via headers in our custom auth
    const requesterRole = request.headers.get("x-user-role") || "citizen";
    await checkPermission(requesterRole, PERMISSIONS.CAN_VIEW_AUDIT_LOGS);

    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const log = await AuditLog.create(body);
    return NextResponse.json(log);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
