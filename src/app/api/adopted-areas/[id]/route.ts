import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import AdoptedArea from "@/models/AdoptedArea";
import { logAudit, checkPermission, PERMISSIONS } from "@/lib/permissions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    const area = await AdoptedArea.findById(id);
    if (!area) return NextResponse.json({ error: "Area not found" }, { status: 404 });

    const { status, adminEmail, adminRole } = body;

    if (status) {
      await checkPermission(adminRole || "admin", PERMISSIONS.CAN_APPROVE_ORG);
      area.status = status;
      if (status === "ADOPTED") {
        area.startDate = new Date();
        const end = new Date();
        end.setMonth(end.getMonth() + area.durationMonths);
        area.endDate = end;
      }
    }

    await area.save();

    if (status) {
      await logAudit(
        `AREA_${status}`,
        adminEmail || "system",
        adminRole || "admin",
        area._id.toString(),
        "AdoptedArea",
        { areaName: area.name },
        "SUCCESS"
      );
    }

    return NextResponse.json(area);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
