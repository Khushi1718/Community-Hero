import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import AdoptedArea from "@/models/AdoptedArea";
import { logAudit } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    const status = searchParams.get("status");

    const query: any = {};
    if (orgId) query.organizationId = orgId;
    if (status) query.status = status;

    const areas = await AdoptedArea.find(query).sort({ createdAt: -1 });
    return NextResponse.json(areas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const area = await AdoptedArea.create(body);

    await logAudit(
      "AREA_ADOPTION_REQUESTED",
      body.organizationId,
      "volunteer_org",
      area._id.toString(),
      "AdoptedArea",
      { areaName: area.name },
      "SUCCESS"
    );

    return NextResponse.json(area);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
