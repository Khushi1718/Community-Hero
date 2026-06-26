import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { Certificate } from "@/models/Certificate";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const cert = await Certificate.findOne({ certificateId: id }).lean();
    if (!cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    return NextResponse.json(cert);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
