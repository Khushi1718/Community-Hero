import mongoose, { Schema, Document } from "mongoose";

export type TimelineAction =
  | "Created"
  | "Status_Changed"
  | "Assigned"
  | "Employee_Accepted"
  | "Employee_Rejected"
  | "Travelling"
  | "Reached_Site"
  | "Inspection_Started"
  | "Inspection_Completed"
  | "Work_Started"
  | "Work_In_Progress"
  | "Work_Paused"
  | "Work_Resumed"
  | "Waiting_For_Materials"
  | "Repair_Completed"
  | "Work_Completed"
  | "Awaiting_Verification"
  | "Admin_Approved"
  | "Admin_Rejected"
  | "Reassigned"
  | "Transferred"
  | "Escalated"
  | "Reopened"
  | "Closed"
  | "Comment_Added"
  | "Evidence_Uploaded"
  | "Assistance_Requested"
  | "Citizen_Feedback"
  | "Image_Uploaded"
  | "Duplicate_Merged"
  | "Progress_Updated";

export interface ITimelineEvent extends Document {
  issueId: mongoose.Types.ObjectId;
  actorId?: mongoose.Types.ObjectId;
  actorName?: string;
  actorRole?: "citizen" | "employee" | "admin" | "super_admin" | "system";
  action: TimelineAction;
  oldValue?: any;
  newValue?: any;
  comment?: string;
  attachments?: string[];
  evidenceCategory?: string;
  isPublic: boolean;       // false = internal (hidden from citizens)
  progressPercentage?: number;
  timestamp: Date;
}

const TimelineEventSchema = new Schema<ITimelineEvent>(
  {
    issueId: { type: Schema.Types.ObjectId, ref: "Issue", required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String },
    actorRole: { type: String, enum: ["citizen", "employee", "admin", "super_admin", "system"] },
    action: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    comment: { type: String },
    attachments: [{ type: String }],
    evidenceCategory: { type: String },
    isPublic: { type: Boolean, default: true },
    progressPercentage: { type: Number },
    timestamp: { type: Date, default: Date.now }
  }
);

TimelineEventSchema.index({ issueId: 1, timestamp: 1 });
TimelineEventSchema.index({ issueId: 1, isPublic: 1 });

export const TimelineEvent =
  mongoose.models.TimelineEvent ||
  mongoose.model<ITimelineEvent>("TimelineEvent", TimelineEventSchema);
