import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { Certificate } from "@/models/Certificate";
import { VolunteerDrive } from "@/models/VolunteerDrive";
import { generateSingleCertificate, sendSingleCertificateEmail } from "@/lib/certificates";

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await connectToDatabase();
    const body = await request.json();
    const { action } = body;

    const cert = await Certificate.findById(params.id);
    if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });

    const drive = await VolunteerDrive.findById(cert.driveId);
    if (!drive) return NextResponse.json({ error: "Drive not found" }, { status: 404 });

    if (action === "retry_generation") {
      // Re-generate and optionally resend
      await generateSingleCertificate(cert._id.toString(), drive);
      if (cert.status === "Generated") {
         await sendSingleCertificateEmail(cert._id.toString(), drive);
      }
      return NextResponse.json({ message: "Retry initiated", cert });
    }

    if (action === "resend_email") {
      // Ensure it is generated before sending
      if (cert.status !== "Generated" && cert.status !== "Sent" && cert.status !== "Failed") {
         return NextResponse.json({ error: "Certificate not yet generated" }, { status: 400 });
      }
      // Override status to trigger resend
      cert.status = "Generated"; 
      await cert.save();
      await sendSingleCertificateEmail(cert._id.toString(), drive);
      return NextResponse.json({ message: "Resend initiated", cert });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await connectToDatabase();
    const cert = await Certificate.findByIdAndDelete(params.id);
    if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    return NextResponse.json({ message: "Certificate deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
