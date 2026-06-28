import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { Issue } from "@/models/Issue";
import { TimelineEvent } from "@/models/TimelineEvent";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import { CommunityPost } from "@/models/CommunityPost";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Props = { params: Promise<{ id: string }> };

// ── Status Transition Validation ───────────────────────────────────────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
  "Reported":                    ["Verified", "Assigned", "Rejected", "Escalated"],
  "Verified":                    ["Assigned", "Rejected", "Escalated"],
  "Assigned":                    ["Employee Accepted", "Rejected", "Transferred", "Escalated", "Community Drive Active"],
  "Community Drive Active":      ["Assigned"],
  "Employee Accepted":           ["Travelling", "Rejected"],
  "Travelling":                  ["Reached Site"],
  "Reached Site":                ["Inspection Started"],
  "Inspection Started":          ["Inspection Completed", "Escalated"],
  "Inspection Completed":        ["Work Started", "Waiting For Materials", "Escalated"],
  "Waiting For Materials":       ["Material Approved", "Work Started"],
  "Material Approved":           ["Work In Progress"],
  "Work Started":                ["Work In Progress"],
  "Work In Progress":            ["Ready For Verification", "Waiting For Materials", "Paused", "Escalated"],
  "Paused":                      ["Work In Progress"],
  "Ready For Verification":      ["Completed", "Work In Progress"],
  "Completed":                   ["Closed"],
  "Awaiting Admin Verification": ["Closed", "Rejected", "Work In Progress"],
  "Awaiting Citizen Review":     ["Closed", "Rejected"],
  "Closed":                      ["Reopened"],
  "Rejected":                    ["Reopened"],
  "Escalated":                   ["Assigned", "Rejected", "Closed"],
  "Reopened":                    ["Assigned", "Verified"],
  "Transferred":                 ["Assigned"],
};

// Admin/super_admin can override some transitions
const ADMIN_OVERRIDE_TRANSITIONS: Record<string, string[]> = {
  "Reported":      ["Assigned", "Verified", "Rejected", "Closed", "Escalated"],
  "Assigned":      ["Community Drive Active"],
  "Awaiting Admin Verification": ["Closed", "Rejected", "Work In Progress"],
  "Ready For Verification":      ["Completed", "Work In Progress"],
  "Awaiting Citizen Review":     ["Closed", "Rejected"],
};

// ── Progress % per status ──────────────────────────────────────────────────────
const PROGRESS_MAP: Record<string, number> = {
  "Reported": 0,
  "Verified": 5,
  "Assigned": 10,
  "Employee Accepted": 15,
  "Travelling": 20,
  "Reached Site": 25,
  "Inspection Started": 35,
  "Inspection Completed": 45,
  "Waiting For Materials": 48,
  "Material Approved": 50,
  "Work Started": 55,
  "Work In Progress": 70,
  "Paused": 70,
  "Ready For Verification": 85,
  "Community Drive Active": 10,
  "Awaiting Admin Verification": 90,
  "Completed": 100,
  "Awaiting Citizen Review": 95,
  "Closed": 100,
};

// ── Notification helpers ───────────────────────────────────────────────────────
async function notify(userId: string, issueId: string, title: string, message: string, type = "Status_Update") {
  try {
    await Notification.create({ userId, issueId, title, message, type: type as any });
  } catch { /* silent */ }
}

async function notifyAll(issue: any, title: string, message: string, type = "Status_Update") {
  const promises: Promise<any>[] = [];
  if (issue.citizenEmail)    promises.push(notify(issue.citizenEmail, issue.issueId, title, message, type));
  if (issue.assignedToName)  {
    const emp = await User.findOne({ name: issue.assignedToName }).select("email");
    if (emp) promises.push(notify(emp.email, issue.issueId, title, message, type));
  }
  if (issue.assignedAdminName) {
    const adm = await User.findOne({ name: issue.assignedAdminName }).select("email");
    if (adm) promises.push(notify(adm.email, issue.issueId, title, message, type));
  }
  await Promise.allSettled(promises);
}

// ── Community Post creation ────────────────────────────────────────────────────
async function createCommunityPostIfNeeded(issue: any) {
  const existing = await CommunityPost.findOne({ issueId: issue.issueId });
  if (existing) return;

  const reportedAt = issue.createdAt;
  const closedAt = new Date();
  const resolutionHours = Math.round((closedAt.getTime() - new Date(reportedAt).getTime()) / 3600000);

  // Get completion image — prefer Completion category evidence
  const completionEvidence = issue.evidences?.find((e: any) => e.category === "Completion" && e.isPublic) || (issue.evidences && issue.evidences.length > 0 ? issue.evidences[issue.evidences.length - 1] : null);
  const afterImage = completionEvidence?.url || issue.resolutionProof?.imageBase64;

  await CommunityPost.create({
    postType: "Municipal_Success",
    issueId: issue.issueId,
    issueRef: issue._id,
    title: issue.title,
    category: issue.aiAnalysis?.category,
    beforeImageUrls: issue.imageUrl ? [issue.imageUrl] : [],
    afterImageUrls: afterImage ? [afterImage] : [],
    location: {
      address: issue.location.address,
      city: issue.location.city,
      state: issue.location.state
    },
    department: issue.assignedDepartment || "General",
    departmentName: issue.assignedDepartment || "General",
    employeeName: issue.assignedToName,
    reportedByName: issue.isPublicRecognitionEnabled ? issue.reportedByName : "A Community Hero Citizen",
    resolvedByName: issue.assignedToName || "Community Hero Team",
    resolutionSummary: completionEvidence?.caption || issue.resolutionProof?.notes || "Issue was resolved successfully by our municipal team.",
    reportedAt: issue.createdAt,
    resolvedAt: closedAt,
    completedAt: closedAt,
    resolutionTimeHours: resolutionHours,
    verificationStatus: "Verified",
  });
}

// ── PATCH Handler ──────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest, props: Props) {
  try {
    const { id } = await props.params;
    await connectToDatabase();

    const query = id.startsWith("CH-") ? { issueId: id } : { _id: id };
    const issue = await Issue.findOne(query);
    if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });

    const body = await request.json();
    const actorName = body.actorName || "System";
    const actorRole = body.actorRole || "system";

    // ── 1. Manual Assignment ────────────────────────────────────────────────
    if (body.assignedTo) {
      const empUser = await User.findOne({ email: body.assignedTo });
      if (empUser) {
        issue.assignedTo = empUser._id;
        issue.assignedToName = empUser.name;
        issue.status = "Assigned";
        issue.assignedAt = new Date();
        issue.progressPercentage = PROGRESS_MAP["Assigned"];
        issue.statusHistory.push({ status: "Assigned", timestamp: new Date(), actorName, actorRole });

        await TimelineEvent.create({
          issueId: issue._id, action: "Assigned", isPublic: true,
          comment: `Assigned to ${empUser.name}`, actorName, actorRole,
          progressPercentage: issue.progressPercentage, timestamp: new Date()
        });

        await notify(empUser.email, issue.issueId, "New Issue Assigned",
          `Issue ${issue.issueId} has been assigned to you.`, "Assignment");
        if (issue.citizenEmail) {
          await notify(issue.citizenEmail, issue.issueId, "Issue Assigned",
            `Your issue ${issue.issueId} has been assigned to ${empUser.name}.`, "Status_Update");
        }
      }
    }

    // ── 2. Status Transition ────────────────────────────────────────────────
    if (body.status && body.status !== issue.status) {
      const currentStatus = issue.status;
      const newStatus = body.status;
      const isAdmin = ["admin", "super_admin"].includes(actorRole);

      // Validate transition
      const allowed = isAdmin
        ? [...(VALID_TRANSITIONS[currentStatus] || []), ...(ADMIN_OVERRIDE_TRANSITIONS[currentStatus] || [])]
        : (VALID_TRANSITIONS[currentStatus] || []);

      if (!allowed.includes(newStatus) && !isAdmin) {
        return NextResponse.json({
          error: `Invalid status transition from "${currentStatus}" to "${newStatus}". Valid: ${allowed.join(", ")}`
        }, { status: 422 });
      }

      issue.status = newStatus;
      issue.progressPercentage = PROGRESS_MAP[newStatus] ?? issue.progressPercentage;
      if (body.progressPercentage !== undefined) issue.progressPercentage = body.progressPercentage;
      issue.statusHistory.push({ status: newStatus, timestamp: new Date(), actorName, actorRole });

      // Special status side-effects
      if (newStatus === "Employee Accepted") issue.acceptedAt = new Date();
      if (newStatus === "Assigned" && !issue.assignedAt) issue.assignedAt = new Date();
      if (["Closed", "Completed"].includes(newStatus)) issue.resolvedAt = new Date();
      if (body.rejectionReason) issue.rejectionReason = body.rejectionReason;
      if (body.assistanceRequested) issue.assistanceRequested = true;

      // Map action type for timeline
      const actionMap: Record<string, string> = {
        "Employee Accepted": "Employee_Accepted",
        "Travelling": "Travelling",
        "Reached Site": "Reached_Site",
        "Inspection Started": "Inspection_Started",
        "Inspection Completed": "Inspection_Completed",
        "Work Started": "Work_Started",
        "Work In Progress": "Work_In_Progress",
        "Paused": "Work_Paused",
        "Ready For Verification": "Ready_For_Verification",
        "Awaiting Admin Verification": "Awaiting_Verification",
        "Completed": "Completed",
        "Closed": "Closed",
        "Rejected": "Employee_Rejected",
        "Escalated": "Escalated",
        "Reopened": "Reopened",
        "Waiting For Materials": "Waiting_For_Materials",
        "Material Approved": "Material_Approved",
      };

      // Citizen-visible events
      const publicStatuses = new Set([
        "Assigned", "Employee Accepted", "Travelling", "Reached Site",
        "Work Started", "Work In Progress", "Ready For Verification", "Completed",
        "Awaiting Admin Verification", "Closed", "Rejected", "Escalated"
      ]);

      await TimelineEvent.create({
        issueId: issue._id,
        action: actionMap[newStatus] || "Status_Changed",
        comment: body.eventName || body.comment || `Status: ${newStatus}`,
        actorName, actorRole,
        isPublic: publicStatuses.has(newStatus),
        progressPercentage: issue.progressPercentage,
        timestamp: new Date()
      });

      // Auto-create community post when completed and verified
      if (newStatus === "Completed") {
        await createCommunityPostIfNeeded(issue);
        await notify("SYSTEM", issue.issueId, "Community Post Published",
          `A community post was created for verified issue ${issue.issueId}.`, "System");
      }

      // Notify stakeholders
      const citizenMsg = `Your issue ${issue.issueId} status: ${newStatus}`;
      const adminMsg = `Issue ${issue.issueId} updated to: ${newStatus}`;
      if (issue.citizenEmail) await notify(issue.citizenEmail, issue.issueId, "Status Update", citizenMsg, "Status_Update");
      if (issue.assignedAdminName) {
        const adm = await User.findOne({ name: issue.assignedAdminName }).select("email");
        if (adm) await notify(adm.email, issue.issueId, "Issue Update", adminMsg, "Status_Update");
      }
    }

    // ── 3. Material Requests & Approvals ────────────────────────────────────
    if (body.materialRequest) {
      issue.materialRequests = issue.materialRequests || [];
      issue.materialRequests.push({
        material: body.materialRequest.material,
        quantity: body.materialRequest.quantity,
        reason: body.materialRequest.reason,
        priority: body.materialRequest.priority,
        evidenceUrl: body.materialRequest.evidenceUrl,
        notes: body.materialRequest.notes,
        status: "Pending",
        requestedAt: new Date()
      });
      await TimelineEvent.create({
        issueId: issue._id, action: "Material_Requested", isPublic: false,
        comment: `Requested ${body.materialRequest.quantity}x ${body.materialRequest.material}. Reason: ${body.materialRequest.reason}`,
        actorName, actorRole, timestamp: new Date()
      });
      // Admin notification handled by frontend calling notify or backend status shift
    }

    if (body.materialAction) {
      // Find the specific request or just update the last pending one
      const reqIndex = issue.materialRequests?.findIndex((r: any) => r._id?.toString() === body.materialAction.requestId) ?? 
                       issue.materialRequests?.findLastIndex((r: any) => r.status === "Pending");
      
      if (reqIndex !== undefined && reqIndex !== -1 && issue.materialRequests) {
        issue.materialRequests[reqIndex].status = body.materialAction.status;
        issue.materialRequests[reqIndex].adminNotes = body.materialAction.adminNotes;
        issue.materialRequests[reqIndex].expectedDeliveryDate = body.materialAction.expectedDeliveryDate;
        issue.materialRequests[reqIndex].supplier = body.materialAction.supplier;
        issue.materialRequests[reqIndex].actionedAt = new Date();

        if (body.materialAction.quantity) {
          issue.materialRequests[reqIndex].quantity = body.materialAction.quantity;
        }

        await TimelineEvent.create({
          issueId: issue._id, action: "Material_Action", isPublic: false,
          comment: `Material Request ${body.materialAction.status}. ${body.materialAction.adminNotes || ""}`,
          actorName, actorRole, timestamp: new Date()
        });
      }
    }

    // ── 4. Resolution Proof Upload ──────────────────────────────────────────
    if (body.resolutionProof) {
      issue.resolutionProof = {
        imageBase64: body.resolutionProof.imageBase64,
        notes: body.resolutionProof.notes,
        timeTaken: body.resolutionProof.timeTaken,
        materialUsed: body.resolutionProof.materialUsed
      };
      // Also add to evidences array
      if (body.resolutionProof.imageBase64) {
        issue.evidences.push({
          url: body.resolutionProof.imageBase64,
          type: "image",
          category: "Completion",
          isPublic: true,
          uploadedBy: actorName,
          uploadedByRole: actorRole,
          caption: body.resolutionProof.notes || "Completion photo",
          uploadedAt: new Date()
        });

        // ── AI Resolution Verification ──
        if (issue.imageUrl) {
          try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (apiKey) {
              const genAI = new GoogleGenerativeAI(apiKey);
              const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
              });

              let beforeMime = "image/jpeg";
              let beforeData = "";
              if (issue.imageUrl.startsWith("data:")) {
                const m = issue.imageUrl.match(/^data:([A-Za-z-+\\/]+);base64,(.+)$/);
                if (m) { beforeMime = m[1]; beforeData = m[2]; }
              } else if (issue.imageUrl.startsWith("http")) {
                const r = await fetch(issue.imageUrl);
                const ab = await r.arrayBuffer();
                beforeData = Buffer.from(ab).toString("base64");
                beforeMime = r.headers.get("content-type") || "image/jpeg";
              }

              let afterMime = "image/jpeg";
              let afterData = "";
              if (body.resolutionProof.imageBase64.startsWith("data:")) {
                const m = body.resolutionProof.imageBase64.match(/^data:([A-Za-z-+\\/]+);base64,(.+)$/);
                if (m) { afterMime = m[1]; afterData = m[2]; }
              } else if (body.resolutionProof.imageBase64.startsWith("http")) {
                const r = await fetch(body.resolutionProof.imageBase64);
                const ab = await r.arrayBuffer();
                afterData = Buffer.from(ab).toString("base64");
                afterMime = r.headers.get("content-type") || "image/jpeg";
              }

              if (beforeData && afterData) {
                const prompt = `You are evaluating a municipal repair. Compare the Before and After images. Has the issue been resolved? Return JSON: { "isResolved": boolean, "confidence": number (0-100), "reasoning": string }`;
                const result = await model.generateContent([
                  prompt,
                  { inlineData: { data: beforeData, mimeType: beforeMime } },
                  { inlineData: { data: afterData, mimeType: afterMime } }
                ]);

                let rawText = result.response.text();
                if (rawText.includes("\`\`\`json")) rawText = rawText.split("\`\`\`json")[1].split("\`\`\`")[0].trim();
                else if (rawText.includes("\`\`\`")) rawText = rawText.split("\`\`\`")[1].split("\`\`\`")[0].trim();
                
                const parsedData = JSON.parse(rawText);
                issue.resolutionVerification = {
                  isResolved: parsedData.isResolved || false,
                  confidence: parsedData.confidence || 0,
                  reasoning: parsedData.reasoning || "Failed to analyze."
                };
              }
            }
          } catch (error) {
            console.error("AI Resolution Verification failed:", error);
          }
        }
      }
      // Only auto-set "Awaiting Admin Verification" if not explicitly setting status
      if (!body.status) {
        issue.status = "Awaiting Admin Verification";
        issue.progressPercentage = PROGRESS_MAP["Awaiting Admin Verification"];
        issue.statusHistory.push({ status: "Awaiting Admin Verification", timestamp: new Date(), actorName, actorRole });
        await TimelineEvent.create({
          issueId: issue._id, action: "Repair_Completed", isPublic: true,
          comment: body.resolutionProof.notes || "Work completed — awaiting admin verification",
          actorName, actorRole, progressPercentage: issue.progressPercentage, timestamp: new Date()
        });
        // Awaiting Admin Verification is legacy. Replaced by Ready For Verification.
        if (issue.citizenEmail) await notify(issue.citizenEmail, issue.issueId, "Work Completed",
          `Work on your issue ${issue.issueId} is complete. Awaiting admin verification.`, "Status_Update");
        if (issue.assignedAdminName) {
          const adm = await User.findOne({ name: issue.assignedAdminName }).select("email");
          if (adm) await notify(adm.email, issue.issueId, "Review Required",
            `Employee completed work on ${issue.issueId}. Please verify.`, "Citizen_Action");
        }
      }
    }

    // ── 5. Evidence Upload ──────────────────────────────────────────────────
    if (body.evidence) {
      const ev = body.evidence;
      issue.evidences.push({
        url: ev.url,
        type: ev.type || "image",
        category: ev.category || "Other",
        isPublic: ev.isPublic ?? false,
        uploadedBy: actorName,
        uploadedByRole: actorRole,
        caption: ev.caption,
        uploadedAt: new Date()
      });
      await TimelineEvent.create({
        issueId: issue._id, action: "Evidence_Uploaded",
        comment: `Evidence uploaded: ${ev.caption || ev.category || "file"}`,
        actorName, actorRole, isPublic: ev.isPublic ?? false,
        evidenceCategory: ev.category, timestamp: new Date()
      });
    }

    // ── 6. Progress Note ────────────────────────────────────────────────────
    if (body.progressNote) {
      const note = body.progressNote;
      if (note.percentage !== undefined) issue.progressPercentage = note.percentage;
      await TimelineEvent.create({
        issueId: issue._id, action: "Progress_Updated",
        comment: note.text || "Progress updated",
        actorName, actorRole, isPublic: note.isPublic ?? true,
        progressPercentage: note.percentage ?? issue.progressPercentage,
        attachments: note.attachments || [],
        timestamp: new Date()
      });
    }

    // ── 7. Citizen Feedback ─────────────────────────────────────────────────
    if (body.citizenFeedback) {
      issue.citizenFeedback = {
        rating: body.citizenFeedback.rating,
        comment: body.citizenFeedback.comment,
        submittedAt: new Date()
      };
      await TimelineEvent.create({
        issueId: issue._id, action: "Citizen_Feedback", isPublic: false,
        comment: `Citizen rated: ${body.citizenFeedback.rating}/5 — ${body.citizenFeedback.comment}`,
        actorName: "Citizen", actorRole: "citizen", timestamp: new Date()
      });
      if (issue.assignedAdminName) {
        const adm = await User.findOne({ name: issue.assignedAdminName }).select("email");
        if (adm) await notify(adm.email, issue.issueId, "Citizen Feedback Received",
          `Issue ${issue.issueId} rated ${body.citizenFeedback.rating}/5.`, "Citizen_Action");
      }
    }

    await issue.save();
    return NextResponse.json({ success: true, issueId: issue.issueId, status: issue.status, progressPercentage: issue.progressPercentage });
  } catch (error: any) {
    console.error("[PATCH /api/issues/[id]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── GET single issue ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest, props: Props) {
  try {
    const { id } = await props.params;
    await connectToDatabase();

    const query = id.startsWith("CH-") ? { issueId: id } : { _id: id };
    const issue = await Issue.findOne(query);
    if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });

    const role = request.headers.get("x-user-role") || "citizen";
    const isPublicOnly = role === "citizen";

    const timelineQuery: any = { issueId: issue._id };
    if (isPublicOnly) timelineQuery.isPublic = true;

    const timeline = await TimelineEvent.find(timelineQuery).sort({ timestamp: 1 });

    const issueObj = issue.toObject();
    if (isPublicOnly) {
      // Strip internal evidences from citizen view
      issueObj.evidences = issueObj.evidences?.filter((e: any) => e.isPublic) || [];
    }

    return NextResponse.json({ ...issueObj, timeline });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
