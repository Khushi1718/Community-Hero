import * as nodemailer from "nodemailer";
import { Certificate } from "@/models/Certificate";
import connectToDatabase from "@/lib/mongoose";
import * as QRCode from "qrcode";
import puppeteer from "puppeteer";
import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Ensure certificates directory exists
const certsDir = path.join(process.cwd(), "public", "certificates");
fs.mkdir(certsDir, { recursive: true }).catch(console.error);

export async function initiateCertificateGeneration(drive: any) {
  await connectToDatabase();
  
  const eligibleVolunteers = drive.volunteers?.filter((v: any) => 
     v.status === "approved" && v.attendance !== false
  ) || [];

  if (eligibleVolunteers.length === 0) return;

  const certificatesToProcess = [];

  for (const vol of eligibleVolunteers) {
    // Check if certificate already exists for this volunteer and drive
    let cert = await Certificate.findOne({ 
      volunteerEmail: vol.email, 
      driveId: drive._id 
    });

    if (!cert) {
      const uniqueId = `CH-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
      const token = crypto.randomUUID();

      cert = await Certificate.create({
        certificateId: uniqueId,
        volunteerEmail: vol.email,
        volunteerName: vol.name,
        driveId: drive._id,
        driveName: drive.title,
        orgId: drive.acceptedOrgId || drive.orgId,
        orgName: drive.acceptedOrgName || drive.orgName,
        verificationToken: token,
        status: "Pending",
        emailSent: false,
        issuedAt: new Date(),
      });
    }

    if (cert.status === "Pending" || cert.status === "Failed") {
      certificatesToProcess.push(cert._id);
    }
  }

  // Trigger background processing asynchronously
  processCertificates(certificatesToProcess, drive).catch(err => {
    console.error("Background processing error:", err);
  });
}

export async function processCertificates(certIds: string[], drive: any) {
  for (const cid of certIds) {
    try {
      await generateSingleCertificate(cid, drive);
      await sendSingleCertificateEmail(cid, drive);
    } catch (err) {
      console.error(`Error processing cert ${cid}:`, err);
    }
  }
}

export async function generateSingleCertificate(certId: string, drive: any) {
  await connectToDatabase();
  const cert = await Certificate.findById(certId);
  if (!cert || cert.status === "Generated" || cert.status === "Sent") return;

  cert.status = "Generating";
  await cert.save();

  try {
    // 1. Generate QR Code
    const verifyUrl = `${BASE_URL}/certificate/verify/${cert.certificateId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, { width: 200, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } });

    // 2. Read template image and convert to base64 for embedding in HTML
    const templatePath = path.join(process.cwd(), "public", "images", "certificate.png");
    const templateBuffer = await fs.readFile(templatePath);
    const templateBase64 = `data:image/png;base64,${templateBuffer.toString('base64')}`;

    // 3. Render HTML
    // We assume the certificate.png is designed for standard A4 landscape (1122x793 px)
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@300;400;600;700;800&display=swap" rel="stylesheet">
        <style>
          body, html {
            margin: 0; padding: 0;
            width: 1122px; height: 793px; /* A4 Landscape at 96 DPI */
            box-sizing: border-box;
            background: url('${templateBase64}') no-repeat center center;
            background-size: 1122px 793px;
            font-family: 'Montserrat', sans-serif;
            position: relative;
            overflow: hidden;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Volunteer Name */
          .volunteer-name {
            position: absolute;
            top: 51.5%;
            left: 50%;
            transform: translate(-50%, -100%);
            font-family: 'Playfair Display', serif;
            font-size: 56px;
            font-weight: 700;
            color: #0f172a;
            text-transform: capitalize;
            text-align: center;
            width: 800px;
          }

          /* Drive Name */
          .drive-title {
            position: absolute;
            top: 63.5%;
            left: 50%;
            transform: translate(-50%, -100%);
            font-size: 32px;
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-weight: 700;
            color: #0f172a;
            text-align: center;
            width: 800px;
          }

          /* Organization Name */
          .org-name {
            position: absolute;
            top: 72.5%;
            left: 50%;
            transform: translate(-50%, -100%);
            font-size: 24px;
            font-weight: 600;
            color: #0f172a;
            text-align: center;
            width: 600px;
          }

          /* Date */
          .completion-date {
            position: absolute;
            top: 75.8%;
            left: 53.5%;
            transform: translate(0, -100%);
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
            text-align: left;
            width: 200px;
          }
          
          /* QR Code */
          .qr-box {
            position: absolute;
            bottom: 40px;
            right: 50px;
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 110px;
            background: white;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05); 
          }
          
          .qr-code { 
            width: 90px; 
            height: 90px; 
            margin-bottom: 8px;
          }

          .cert-id { 
            font-family: monospace; 
            font-size: 10px; 
            font-weight: 600;
            color: #64748b; 
            letter-spacing: 0.5px;
            text-align: center;
            margin-bottom: 4px;
          }

          .qr-verify {
            font-size: 9px;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: 0.5px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="volunteer-name">${cert.volunteerName}</div>
        <div class="drive-title">${drive.title}</div>
        <div class="org-name">${cert.orgName || 'Community Volunteers'}</div>
        <div class="completion-date">${new Date(cert.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

        <div class="qr-box">
           <img src="${qrCodeDataUrl}" class="qr-code" />
           <div class="cert-id">${cert.certificateId}</div>
           <div class="qr-verify">SCAN TO VERIFY</div>
        </div>
      </body>
      </html>
    `;

    // 4. Print to PDF and PNG using Puppeteer
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'] 
    });
    
    const page = await browser.newPage();
    // Set viewport exactly to A4 landscape size
    await page.setViewport({ width: 1122, height: 793, deviceScaleFactor: 2 });
    
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    
    const pdfFileName = `${cert.certificateId}.pdf`;
    const pngFileName = `${cert.certificateId}.png`;
    
    const pdfFilePath = path.join(certsDir, pdfFileName);
    const pngFilePath = path.join(certsDir, pngFileName);
    
    // Generate High-Res PDF
    await page.pdf({
      path: pdfFilePath,
      format: 'A4',
      landscape: true,
      printBackground: true
    });

    // Generate High-Res PNG
    await page.screenshot({
      path: pngFilePath,
      type: 'png',
      fullPage: true
    });
    
    await browser.close();

    // 5. Update DB
    cert.certificatePdfUrl = `/certificates/${pdfFileName}`;
    cert.certificateImageUrl = `/certificates/${pngFileName}`;
    cert.status = "Generated";
    await cert.save();

  } catch (err: any) {
    cert.status = "Failed";
    cert.errorLog = err.message;
    await cert.save();
    throw err;
  }
}

export async function sendSingleCertificateEmail(certId: string, drive: any) {
  await connectToDatabase();
  const cert = await Certificate.findById(certId);
  
  if (!cert || cert.status !== "Generated") return;

  cert.status = "Sending";
  await cert.save();

  const { SMTP_HOST, SMTP_PORT, SMTP_EMAIL, SMTP_PASSWORD, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_EMAIL || !SMTP_PASSWORD || !SMTP_FROM) {
    cert.status = "Failed";
    cert.errorLog = "SMTP Credentials missing in environment.";
    await cert.save();
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT),
    secure: parseInt(SMTP_PORT) === 465,
    auth: {
       user: SMTP_EMAIL,
       pass: SMTP_PASSWORD,
    },
  });

  try {
    const pdfFilePath = path.join(process.cwd(), "public", cert.certificatePdfUrl!);

    const downloadUrl = `${BASE_URL}${cert.certificatePdfUrl}`;
    const verifyUrl = `${BASE_URL}/certificate/verify/${cert.certificateId}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; background-color: #f9f9f9; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #10b981; letter-spacing: 1px; }
          h1 { color: #0f172a; font-size: 22px; margin-bottom: 10px; }
          p { margin-bottom: 20px; font-size: 16px; color: #475569; }
          .highlight { font-weight: bold; color: #10b981; }
          .button-container { text-align: center; margin: 30px 0; }
          .button { background-color: #10b981; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; }
          .footer { margin-top: 40px; text-align: center; font-size: 14px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌟 COMMUNITY HERO</div>
          </div>
          <h1>Congratulations, ${cert.volunteerName}!</h1>
          <p>Thank you for your invaluable participation in the drive <span class="highlight">"${drive.title}"</span> organized by ${cert.orgName || "Community Volunteers"}.</p>
          <p>Your dedication and effort have helped make a massive positive impact in our community. Please find attached your official <strong>Certificate of Appreciation</strong> recognizing your contribution.</p>
          
          <div class="button-container">
            <a href="${downloadUrl}" class="button" style="color: white;">Download PDF Certificate</a>
          </div>

          <p>You can also verify the authenticity of this certificate at any time by visiting our verification portal:</p>
          <p><a href="${verifyUrl}" style="color: #10b981;">${verifyUrl}</a></p>
          
          <p>Thank you for being a Community Hero!</p>
          
          <div class="footer">
            <p>The Community Hero Team<br>Building better communities together.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
       from: `"Community Hero" <${SMTP_FROM}>`,
       to: cert.volunteerEmail,
       subject: `Your Certificate for ${drive.title} - Community Hero`,
       html: htmlBody,
       attachments: [
         {
           filename: `Certificate_${cert.certificateId}.pdf`,
           path: pdfFilePath,
           contentType: 'application/pdf'
         }
       ]
    });

    cert.status = "Sent";
    cert.emailSent = true;
    cert.emailSentAt = new Date();
    await cert.save();
  } catch (err: any) {
    cert.status = "Failed";
    cert.errorLog = `SMTP Error: ${err.message}`;
    await cert.save();
  }
}
