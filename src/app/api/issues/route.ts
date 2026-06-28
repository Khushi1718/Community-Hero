import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { Issue } from "@/models/Issue";
import { TimelineEvent } from "@/models/TimelineEvent";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import { IntegrationConfig } from "@/models/IntegrationConfig";
import { pushToExternalCRM } from "@/lib/integrations/pushToExternalCRM";

// Helper to map V2 MongoDB Issue to V1 Frontend Issue format
const mapToV1Format = async (issueDoc: any) => {
  const issue = issueDoc.toObject ? issueDoc.toObject() : issueDoc;
  
  // Fetch timeline
  const timelineEvents = await TimelineEvent.find({ issueId: issue._id }).sort({ timestamp: 1 });
  
  return {
    id: issue.issueId,
    _id: issue._id.toString(),
    citizenEmail: issue.citizenEmail || (issue.reportedBy ? "citizen@mapped.com" : "unknown"),
    imageBase64: issue.imageUrl || "",
    description: issue.description,
    location: issue.location.coordinates.join(","), // V1 expects string
    state: issue.location.state,
    city: issue.location.city,
    address: issue.location.address,
    timestamp: new Date(issue.createdAt).getTime(),
    aiAnalysis: {
      category: issue.aiAnalysis.category || "Unknown",
      severity: issue.aiAnalysis.severity || "Medium",
      reasoningPoints: [],
      department: issue.aiAnalysis.department || "General",
      trust: {
        status: issue.aiAnalysis.isFake ? "Suspicious" : "Verified",
        checks: {
          hasGPS: true,
          isFresh: true,
          confidenceScore: Math.round(issue.aiAnalysis.confidenceScore * 100),
          cameraSource: issue.cameraSource || "Level 2 (Gallery Upload)"
        }
      }
    },
    verificationScore: issue.verificationScore || 0,
    cameraSource: issue.cameraSource || "Level 2 (Gallery Upload)",
    deviceInfo: issue.deviceInfo,
    browserInfo: issue.browserInfo,
    status: issue.status,
    priority: issue.priority,
    assignedTo: issue.assignedToName || undefined, 
    assignedDepartment: issue.assignedDepartment || undefined, 
    assignedAdmin: issue.assignedAdminName || undefined,
    eta: issue.expectedCompletionTime ? new Date(issue.expectedCompletionTime).getTime() : Date.now() + 86400000,
    progressPercentage: issue.progressPercentage || 0,
    timeline: timelineEvents.map(e => ({
      event: e.comment || e.action, // mapping
      timestamp: new Date(e.timestamp).getTime(),
      actorName: e.actorName,
      actorRole: e.actorRole,
      metadata: {
        notes: e.comment,
        imageBase64: e.attachments?.[0]
      }
    })),
    progressUpdates: timelineEvents
        .filter(e => e.action === "Comment_Added" || e.comment)
        .map(e => ({
            timestamp: new Date(e.timestamp).getTime(),
            note: e.comment || "",
            author: e.actorName || "Staff",
            role: e.actorRole,
            progressPercentage: e.progressPercentage,
            attachments: e.attachments
        })),
    resolutionProof: issue.resolutionProof,
    citizenFeedback: issue.citizenFeedback,
    materialRequests: issue.materialRequests || [],
    evidences: issue.evidences || [],
    resolutionVerification: issue.resolutionVerification
  };
};

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get("assignedTo");
    const assignedAdmin = searchParams.get("assignedAdmin");
    const citizenEmail = searchParams.get("citizenEmail");
    const status = searchParams.get("status");
    const state = searchParams.get("state");
    const city = searchParams.get("city");
    const department = searchParams.get("department");
    
    let query: any = {};
    
    if (assignedTo) {
        // Safe lookup: never cast an email string to ObjectId
        const isObjectId = /^[a-f0-9]{24}$/.test(assignedTo);
        const emailQuery = { $regex: new RegExp(`^${assignedTo.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
        const user = await User.findOne(
          isObjectId
            ? { $or: [{ email: emailQuery }, { _id: assignedTo }] }
            : { email: emailQuery }
        );
        if (user) {
            query.assignedTo = user._id;
        } else {
            // Fallback: match by assignedToName (handles legacy data assigned by name)
            query.assignedToName = { $regex: new RegExp(`^${assignedTo.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
        }
    }

    if (assignedAdmin) {
        const isObjectId = /^[a-f0-9]{24}$/.test(assignedAdmin);
        const adminUser = await User.findOne(
          isObjectId
            ? { $or: [{ email: { $regex: new RegExp(`^${assignedAdmin.trim()}$`, 'i') } }, { _id: assignedAdmin }] }
            : { email: { $regex: new RegExp(`^${assignedAdmin.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
        );
        if (adminUser) {
            query.assignedAdmin = adminUser._id;
        } else {
            query.assignedAdminName = assignedAdmin;
        }
    }
    
    if (citizenEmail) {
        // Case-insensitive email match for robustness
        const emailRegex = new RegExp(`^${citizenEmail.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        query.$or = [
            { citizenEmail: emailRegex },
            { upvotedBy: citizenEmail.trim() }
        ];
    }
    
    if (status) {
        query.status = status;
    }

    if (state) {
        query["location.state"] = { $regex: new RegExp(`^${state.trim()}$`, 'i') };
    }

    if (city) {
        query["location.city"] = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
    }

    if (department) {
        query.assignedDepartment = { $regex: new RegExp(department.trim(), 'i') };
    }
    
    const issues = await Issue.find(query).sort({ createdAt: -1 });
    const v1Issues = await Promise.all(issues.map(mapToV1Format));
    
    return NextResponse.json(v1Issues);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    // Convert V1 body to V2 Document
    // Generate a unique ID like CH-2026-XXXX
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const issueId = `CH-${new Date().getFullYear()}-${randomNum}`;
    
    let coords = [0, 0];
    if (body.location) {
        const parts = body.location.split(",");
        if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
                coords = [lng, lat]; // [lng, lat] expected by GeoJSON
            }
        }
    }

    // --- Duplicate Detection Logic (Geo-Spatial) ---
    // If frontend already provided isDuplicateOf and wants to upvote
    if (body.isDuplicateOf && body.duplicateStatus === "Pending") {
      const existingIssue = await Issue.findById(body.isDuplicateOf);
      if (existingIssue) {
        if (!existingIssue.upvotedBy.includes(body.citizenEmail)) {
           existingIssue.upvotedBy.push(body.citizenEmail);
           existingIssue.upvotes = (existingIssue.upvotes || 0) + 1;
           // Escalate priority if many upvotes
           if (existingIssue.upvotes >= 3 && existingIssue.priority !== "P1_Critical") {
              existingIssue.priority = "P1_Critical";
           }
           await existingIssue.save();
        }
        return NextResponse.json(mapToV1Format(existingIssue), { status: 200 });
      }
    } else if (coords[0] !== 0 && coords[1] !== 0 && body.duplicateStatus !== "Overridden") {
      try {
        // Perform $nearSphere search to detect duplicates
        const duplicateMatches = await Issue.find({
          "aiAnalysis.category": body.aiAnalysis?.category,
          status: { $in: ["Reported", "Open", "Assigned", "In Progress", "WAITING_FOR_ORG"] },
          location: {
            $nearSphere: {
              $geometry: { type: "Point", coordinates: coords },
              $maxDistance: 50 // 50 meters
            }
          }
        }).limit(1);

        if (duplicateMatches.length > 0) {
           // Return 409 Conflict with special payload so frontend can trigger override UI
           return NextResponse.json({
              error: "Possible duplicate detected",
              isDuplicate: true,
              duplicateWarningId: duplicateMatches[0].id
           }, { status: 409 });
        }
      } catch (geoError) {
        console.error("Geo-spatial duplicate detection failed, proceeding without it:", geoError);
        // Fallback: Proceed with normal issue creation if geo query fails (e.g. index missing)
      }
    }

    let assignedToId: any = undefined;
    let assignedToName: string | undefined = undefined;
    let assignedDepartment = body.aiAnalysis?.department || "General";
    let assignedAdminId: any = undefined;
    let assignedAdminName: string | undefined = undefined;

    // --- PROMPT 4B: Emergency Mode ---
    const emergencyKeywords = ["gas leak", "fire", "electrical hazard", "road collapse", "flooding", "transformer", "live wire"];
    const isEmergency = emergencyKeywords.some(kw => 
      body.description?.toLowerCase().includes(kw) || 
      body.aiAnalysis?.category?.toLowerCase().includes(kw)
    );

    let priority = body.aiAnalysis?.severity === "Critical" ? "P1_Critical" : body.aiAnalysis?.severity === "High" ? "P2_High" : "P3_Medium";
    if (isEmergency) priority = "P1_Critical";

    // --- PROMPT 4B: Smart Routing (Adopted Area Check) ---
    // Look up if location exists inside an adopted area
    let adoptedAreaId = undefined;
    let adoptedOrgId = undefined;
    let routeToOrg = false;

    if (!isEmergency) {
      const AdoptedArea = require("@/models/AdoptedArea").default;
      // We do a loose regex search on the area name vs address or city
      const adoptedAreas = await AdoptedArea.find({ status: "ADOPTED" });
      for (const area of adoptedAreas) {
        if (body.address?.toLowerCase().includes(area.name.toLowerCase()) || 
            body.description?.toLowerCase().includes(area.name.toLowerCase())) {
          adoptedAreaId = area._id.toString();
          adoptedOrgId = area.organizationId;
          routeToOrg = true;
          break;
        }
      }
    }

    // Attempt to auto-assign based on location and department with loose regex matching
    const deptPrefix = assignedDepartment.split(' ')[0].replace(/s$/i, ''); // e.g. "Roads" -> "Road"
    
    // Find matching employee — use $ne: false so we match employees where isAvailable is true OR undefined (legacy)
    const matchingStaff = await User.findOne({
      role: "employee",
      $or: [
        { state: { $regex: new RegExp(`^${(body.state || '').trim()}$`, 'i') } },
        { state: { $exists: false } }
      ],
      department: { $regex: new RegExp(deptPrefix, 'i') },
      isAvailable: { $ne: false } // match true or missing (default true per schema)
    });

    if (matchingStaff && !routeToOrg) {
      assignedToId = matchingStaff._id;
      assignedToName = matchingStaff.name;
    }

    // Find matching Admin — use $ne: false for isAvailable check as well
    const matchingAdmin = await User.findOne({
      role: "admin",
      $or: [
        { state: { $regex: new RegExp(`^${(body.state || '').trim()}$`, 'i') } },
        { state: { $exists: false } }
      ],
      department: { $regex: new RegExp(deptPrefix, 'i') },
      isAvailable: { $ne: false }
    });

    if (matchingAdmin) {
      assignedAdminId = matchingAdmin._id;
      assignedAdminName = matchingAdmin.name;
    }

    // SLA / Deadline Calculation
    const now = Date.now();
    let expectedTimeMs = now + (7 * 24 * 60 * 60 * 1000); // default 7 days
    if (priority === "P1_Critical") expectedTimeMs = now + (24 * 60 * 60 * 1000); // 24 hours
    else if (priority === "P2_High") expectedTimeMs = now + (48 * 60 * 60 * 1000); // 48 hours
    else if (priority === "P3_Medium") expectedTimeMs = now + (7 * 24 * 60 * 60 * 1000); // 7 days
    else expectedTimeMs = now + (14 * 24 * 60 * 60 * 1000); // 14 days

    const newIssue = await Issue.create({
      issueId,
      title: body.aiAnalysis?.category || "Reported Issue",
      description: body.description,
      priority: priority,
      status: routeToOrg ? "WAITING_FOR_ORG" : (assignedToName ? "Assigned" : "Reported"),
      citizenEmail: body.citizenEmail,
      assignedTo: assignedToId,
      assignedToName: assignedToName,
      assignedDepartment: assignedDepartment,
      assignedAdmin: assignedAdminId,
      assignedAdminName: assignedAdminName,
      adoptedAreaId: adoptedAreaId,
      isEmergency: isEmergency,
      location: {
          type: "Point",
          coordinates: coords,
          address: body.address || "Unknown Location",
          state: body.state,
          city: body.city
      },
      imageUrl: body.imageBase64,
      aiAnalysis: {
          confidenceScore: body.aiAnalysis?.trust?.checks?.confidenceScore ? body.aiAnalysis.trust.checks.confidenceScore / 100 : 0.8,
          urgencyScore: 0.5,
          isFake: body.aiAnalysis?.trust?.status === "Suspicious",
          category: body.aiAnalysis?.category,
          department: body.aiAnalysis?.department,
          severity: body.aiAnalysis?.severity,
          severityReason: body.aiAnalysis?.severityReason
      },
      verificationScore: body.aiAnalysis?.verificationScore || 0,
      cameraSource: body.aiAnalysis?.trust?.checks?.cameraSource || "Level 2 (Gallery Upload)",
      deviceInfo: body.deviceInfo,
      browserInfo: body.browserInfo,
      expectedCompletionTime: new Date(expectedTimeMs),
      upvotes: 0,
      upvotedBy: [body.citizenEmail]
    });

    // Create initial timeline event
    await TimelineEvent.create({
      issueId: newIssue._id,
      action: "Reported",
      actorName: "Citizen",
      actorRole: "citizen",
      isPublic: true,
      comment: "Issue reported by citizen."
    });

    if (assignedToName) {
      await TimelineEvent.create({
        issueId: newIssue._id,
        action: "Assigned",
        actorName: "System AI",
        actorRole: "system",
        isPublic: true,
        comment: `Auto-assigned to ${assignedToName}`
      });

      await Notification.create({
          userId: matchingStaff!.email,
          issueId: issueId,
          title: "New Auto-Assignment",
          message: `You have been automatically assigned to a new issue: ${issueId}`,
          type: "Assignment"
      });
      
      // Notify Admin
      if (matchingAdmin) {
        await Notification.create({
            userId: matchingAdmin.email,
            issueId: issueId,
            title: "New Issue in Jurisdiction",
            message: `A new issue (${issueId}) was reported and assigned to ${assignedToName}.`,
            type: "Assignment"
        });
      }
    }

    if (routeToOrg) {
      await TimelineEvent.create({
        issueId: newIssue._id,
        action: "Routed_To_Community",
        actorName: "System AI",
        actorRole: "System",
        comment: `Issue occurred in Adopted Area. Routed to managing organization.`
      });
      // Ping Org via Notification
      const orgDoc = await require("@/models/VolunteerOrganization").VolunteerOrganization.findById(adoptedOrgId);
      if (orgDoc) {
        await Notification.create({
          userId: orgDoc.contactEmail,
          orgId: adoptedOrgId,
          type: "Org_Drive",
          title: "New Issue in Adopted Area",
          message: `An issue (${newIssue.title}) was reported in your adopted area. Please review and manage it within your response window.`
        });
      }
    }

    if (isEmergency && assignedAdminId) {
      // Alert Admin
      const adminDoc = await User.findById(assignedAdminId);
      if (adminDoc) {
        await Notification.create({
          userId: adminDoc.email,
          type: "System",
          title: "CRITICAL EMERGENCY ALERT",
          message: `An emergency issue (${newIssue.title}) has been detected. Employee ${assignedToName || 'has not been'} automatically assigned.`
        });
      }
    }
    
    // Create AI categorization event if it exists
    if (body.timeline && body.timeline.length > 1) {
         await TimelineEvent.create({
            issueId: newIssue._id,
            action: "Status_Changed",
            comment: body.timeline[1].event,
            actorRole: "system",
            timestamp: new Date(body.timeline[1].timestamp || Date.now() + 1000)
        });
    }

    // --- EXTERNAL CRM SYNC (Non-blocking) ---
    // We look up the integration config using the city from the location payload
    if (body.city) {
      IntegrationConfig.findOne({ cityId: body.city }).then(config => {
        if (config) {
          if (config.enabled) {
            pushToExternalCRM(newIssue, config).catch(err => {
              console.error(`Background CRM webhook sync failed for ${newIssue.issueId}:`, err);
            });
          }
          if (config.pubSubEnabled && config.pubSubTopic) {
            const { publishToPubSub } = require("@/lib/integrations/publishToPubSub");
            const { buildCRMPayload } = require("@/lib/integrations/buildPayload");
            const payload = buildCRMPayload(newIssue, config);
            
            publishToPubSub({
              topicName: config.pubSubTopic,
              payload,
              serviceAccountKeyEncrypted: config.pubSubServiceAccountKeyEncrypted,
              issueId: newIssue.issueId || newIssue._id.toString(),
              eventType: "TICKET_CREATED"
            }).catch((err: any) => {
              console.error(`Background CRM Pub/Sub sync failed for ${newIssue.issueId}:`, err);
            });
          }
        }
      }).catch(err => {
        console.error("Failed to fetch IntegrationConfig:", err);
      });
    }

    const v1Response = await mapToV1Format(newIssue);
    return NextResponse.json(v1Response, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
