import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import nodemailer from "nodemailer";
import connectToDatabase from "@/lib/mongoose";
import { Certificate } from "@/models/Certificate";

export async function POST(request: NextRequest) {
  try {
    const { orgName, volunteerName, volunteerEmail, driveTitle, driveLocation, hours } = await request.json();

    if (!volunteerEmail) {
      return NextResponse.json({ error: "Volunteer email is required" }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Generate unique Certificate ID
    const certId = `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-certificate/${certId}`;

    // 2. Call Gemini for certificate generation
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert HTML and CSS designer. Create a premium, visually stunning single-file HTML certificate of appreciation.
      It should NOT use any external CSS files, only inline styles or a <style> block.
      Do NOT include any markdown formatting like \`\`\`html. Just return the raw HTML.
      
      Requirements for the certificate:
      - Title: "Certificate of Appreciation"
      - Organization: "Community Hero" & "${orgName}"
      - Awarded to: "${volunteerName}"
      - For: Outstanding contribution to "${driveTitle}" in "${driveLocation}"
      - Impact: ${hours} Hours of community service
      - Verification Link: "${verificationUrl}"
      - Certificate ID: "${certId}"
      - Design: Premium, elegant, formal borders, gold accents, professional typography. Use rich aesthetics.
      - Make sure the logo "Community Hero" is prominent.
    `;

    const result = await model.generateContent(prompt);
    let htmlContent = result.response.text();
    
    // Clean up any markdown code block wrappers
    htmlContent = htmlContent.replace(/```html/gi, '').replace(/```/gi, '').trim();

    // 3. Save to Database
    const newCert = await Certificate.create({
      certificateId: certId,
      type: "VOLUNTEER",
      issuedToId: volunteerEmail,
      issuedToType: "citizen",
      issuedToName: volunteerName,
      driveName: driveTitle,
      orgName: orgName,
      locationCity: driveLocation,
      hours: hours,
      geminiMessage: "Automatically generated and verified by AI.",
      qrCodeData: verificationUrl,
      verificationUrl: verificationUrl
    });

    // 4. Send Email via nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Community Hero" <${process.env.GMAIL_USER}>`,
      to: volunteerEmail,
      subject: `Your Certificate of Appreciation - ${driveTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
           <p>Hi ${volunteerName},</p>
           <p>Thank you for your outstanding contribution to <strong>${driveTitle}</strong>.</p>
           <p>Please find your digital Certificate of Appreciation below:</p>
           <hr/>
           ${htmlContent}
           <hr/>
           <p>You can also verify your certificate at any time here: <a href="${verificationUrl}">${verificationUrl}</a></p>
           <p>Thank you,<br/>The Community Hero Team & ${orgName}</p>
        </div>
      `
    };

    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
       await transporter.sendMail(mailOptions);
    } else {
       console.log("No email credentials found. Certificate generated but not emailed. Please configure GMAIL_USER and GMAIL_APP_PASSWORD in .env.local.");
    }

    return NextResponse.json({ success: true, certificateId: certId });
  } catch (error: any) {
    console.error("Certificate generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
