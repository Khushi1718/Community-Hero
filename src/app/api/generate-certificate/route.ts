import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { Certificate } from "@/models/Certificate";
import { VolunteerDrive } from "@/models/VolunteerDrive";
import { generateSingleCertificate, sendSingleCertificateEmail } from "@/lib/certificates";
import * as crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { driveId, volunteerEmail } = await request.json();

    if (!driveId || !volunteerEmail) {
      return NextResponse.json({ error: "Missing driveId or volunteerEmail" }, { status: 400 });
    }

    const drive = await VolunteerDrive.findById(driveId);
    if (!drive) return NextResponse.json({ error: "Drive not found" }, { status: 404 });

    const volunteer = drive.volunteers?.find((v: any) => v.email === volunteerEmail);
    if (!volunteer) return NextResponse.json({ error: "Volunteer not found in this drive" }, { status: 404 });

    // Find or create certificate record
    let cert = await Certificate.findOne({ driveId, volunteerEmail });

    if (!cert) {
      const uniqueId = `CH-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
      const token = crypto.randomUUID();

      cert = await Certificate.create({
        certificateId: uniqueId,
        volunteerEmail: volunteer.email,
        volunteerName: volunteer.name,
        driveId: drive._id,
        orgId: drive.orgId,
        orgName: drive.acceptedOrgName || drive.orgName,
        verificationToken: token,
        status: "Pending",
        // Legacy fields for cached Mongoose schema hotfix
        type: "VOLUNTEER",
        issuedToId: volunteer.email,
        issuedToType: "citizen",
        issuedToName: volunteer.name,
        verificationUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-certificate/${uniqueId}`,
        qrCodeData: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-certificate/${uniqueId}`
      });
    }

    // Generate PDF using Puppeteer pipeline
    await generateSingleCertificate(cert._id.toString(), drive);
    
    // Check if generated successfully
    cert = await Certificate.findById(cert._id);
    if (cert?.status === "Generated") {
       await sendSingleCertificateEmail(cert._id.toString(), drive);
       cert = await Certificate.findById(cert._id);
       if (cert?.status === "Sent") {
           return NextResponse.json({ success: true, message: "Certificate generated and sent!" });
       }
    }

    return NextResponse.json({ error: cert?.errorLog || "Failed to generate or send" }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
