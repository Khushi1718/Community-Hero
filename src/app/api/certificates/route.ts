import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { Certificate } from "@/models/Certificate";
import { VolunteerDrive } from "@/models/VolunteerDrive";
import { initiateCertificateGeneration, sendSingleCertificateEmail } from "@/lib/certificates";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const driveId = searchParams.get("driveId");
    const volunteerEmail = searchParams.get("volunteerEmail");

    let query: any = {};
    if (driveId) query.driveId = driveId;
    if (volunteerEmail) query.volunteerEmail = volunteerEmail;

    const certificates = await Certificate.find(query).sort({ createdAt: -1 });
    return NextResponse.json(certificates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { driveId, action, certificateId } = body;

    // Resend Email functionality
    if (action === "resend_email" && certificateId) {
       const cert = await Certificate.findById(certificateId);
       if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
       const drive = await VolunteerDrive.findById(cert.driveId);
       if (!drive) return NextResponse.json({ error: "Drive not found" }, { status: 404 });
       
       sendSingleCertificateEmail(cert._id, drive).catch(console.error);
       return NextResponse.json({ message: "Email resend triggered" });
    }

    if (!driveId) return NextResponse.json({ error: "Missing driveId" }, { status: 400 });

    const drive = await VolunteerDrive.findById(driveId);
    if (!drive) return NextResponse.json({ error: "Drive not found" }, { status: 404 });

    if (drive.status !== "COMPLETED" && drive.status !== "VERIFIED") {
       drive.status = "COMPLETED";
       await drive.save();
    }

    await initiateCertificateGeneration(drive);

    return NextResponse.json({ message: "Certificate generation started" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
