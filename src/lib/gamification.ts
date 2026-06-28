import { User } from "@/models/User";
import { VolunteerOrganization } from "@/models/VolunteerOrganization";
import { PointTransaction } from "@/models/PointTransaction";
import { Certificate } from "@/models/Certificate";
import { IVolunteerDrive } from "@/models/VolunteerDrive";
import { checkCitizenAchievements, checkOrgAchievements } from "./achievements";
import { Notification } from "@/models/Notification";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function processDriveGamification(drive: IVolunteerDrive) {
  const driveHours = drive.durationHours || 1;
  const orgPoints = 100;
  const citizenPoints = 60; // 60 for complete drive
  
  // Award Org Points
  if (drive.acceptedOrgId) {
    const org = await VolunteerOrganization.findById(drive.acceptedOrgId);
    if (org) {
      org.points = (org.points || 0) + orgPoints;
      org.totalVolunteerHours = (org.totalVolunteerHours || 0) + (drive.hoursWorked || 0);
      await org.save();
      
      await PointTransaction.create({
        targetId: org._id.toString(),
        targetType: "organization",
        points: orgPoints,
        reason: "Successfully Completed Drive",
        referenceId: drive._id.toString()
      });
      
      await checkOrgAchievements(org._id.toString(), {
        drives: org.completedDrivesCount || 0,
        volunteers: org.members?.length || 0, // rough metric
        hours: org.totalVolunteerHours
      });
    }
  }

  // Award Citizen Points, Hours, Certificates
  if (drive.volunteers && drive.volunteers.length > 0) {
    const presentVolunteers = drive.volunteers.filter(v => v.attendance === "present");
    
    // Generate AI message for all certificates in this drive
    let geminiMessage = "Thank you for your valuable contribution to the community.";
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Generate a very short, 1-2 sentence appreciation message for volunteers who participated in a community drive. 
      The drive was categorized as ${drive.category}. Work performed: ${drive.workPerformed || 'general community service'}.
      Keep it professional, inspiring, and very concise.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) geminiMessage = text.trim();
    } catch (e) {
      console.error("Gemini certificate message generation failed:", e);
    }
    
    for (const vol of presentVolunteers) {
      if (!vol.email) continue;
      
      const user = await User.findOne({ email: vol.email });
      if (user) {
         user.communityInfo = user.communityInfo || {} as any;
         user.communityInfo!.volunteerHours = (user.communityInfo!.volunteerHours || 0) + driveHours;
         user.communityInfo!.completedDrives = (user.communityInfo!.completedDrives || 0) + 1;
         user.communityInfo!.points = (user.communityInfo!.points || 0) + citizenPoints;
         await user.save();
         
         await PointTransaction.create({
            targetId: user.email,
            targetType: "citizen",
            points: citizenPoints,
            reason: "Completed Entire Drive",
            referenceId: drive._id.toString()
         });
         
         // Generate Certificate
         const certId = "CERT-" + crypto.randomBytes(4).toString('hex').toUpperCase();
         const certUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-certificate/${certId}`;
         
         const cert = await Certificate.create({
            certificateId: certId,
            type: "VOLUNTEER",
            issuedToId: user.email,
            issuedToType: "citizen",
            issuedToName: user.name,
            driveId: drive._id.toString(),
            driveName: drive.title,
            issueId: drive.issueId,
            orgId: drive.acceptedOrgId?.toString(),
            orgName: drive.acceptedOrgName || "Community Hero Volunteers",
            locationCity: drive.city,
            hours: driveHours,
            geminiMessage,
            qrCodeData: certUrl,
            verificationUrl: certUrl
         });
         
         user.communityInfo!.certificates = user.communityInfo!.certificates || [];
         user.communityInfo!.certificates.push(certId);
         await user.save();
         
         await Notification.create({
             userId: user.email,
             type: "Certificate",
             title: "Certificate Generated",
             message: `Your certificate for "${drive.title}" is ready!`
         });
         
         // Prompt feedback
         if (drive.acceptedOrgId) {
             await Notification.create({
                 userId: user.email,
                 type: "System",
                 title: "Rate Your Experience",
                 message: `Please leave feedback for the organization that ran "${drive.title}".`
             });
         }
         
         await checkCitizenAchievements(user.email, {
             hours: user.communityInfo!.volunteerHours,
             drives: user.communityInfo!.completedDrives,
             trees: drive.treesPlanted || 0, // simplistic, doesn't aggregate lifetime trees
             waste: drive.wasteCollected || 0
         });
      }
    }
  }
}
