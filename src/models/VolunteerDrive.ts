import mongoose, { Schema, Document } from "mongoose";
import { WorkCategory } from "./VolunteerOrganization";

export type DriveStatus = 
  | "OPEN" // legacy Prompt 1 org-created drives
  | "CANCELLED" 
  | "COMPLETED"
  | "WAITING_FOR_ORG" // below are for Prompt 2 admin-created community drives
  | "ORG_PENDING_APPROVAL"
  | "ORG_APPROVED"
  | "VOLUNTEER_REG_OPEN"
  | "REG_CLOSED"
  | "DRIVE_IN_PROGRESS"
  | "DRIVE_COMPLETED"
  | "ADMIN_VERIFICATION_PENDING"
  | "VERIFIED"
  | "FAILED"
  | "OVERDUE";

export interface IOrgRequest {
  orgId: mongoose.Types.ObjectId;
  orgName: string;
  trustScore: number;
  completedDrives: number;
  category: string;
  members: number;
  status: "pending" | "approved" | "rejected" | "declined";
  message?: string;
  requestedAt: Date;
  respondedAt?: Date;
}

export interface IVolunteer {
  _id?: mongoose.Types.ObjectId;
  userId?: string; // Citizen email or ID
  name: string;
  phone: string;
  email: string;
  age: number;
  emergencyContact?: string;
  reasonForJoining?: string;
  previousDrives?: number;
  previousHours?: number;
  attendancePercentage?: number;
  status: "pending" | "approved" | "rejected" | "completed";
  joinedAt: Date;
  attendance?: "present" | "absent" | "late" | null;
}

export interface IDriveTimeline {
  milestone: string;
  note?: string;
  imageUrl?: string;
  postedAt: Date;
}

export interface IVolunteerDrive extends Document {
  // Owning organization (optional for admin-created drives until accepted)
  orgId?: mongoose.Types.ObjectId;
  orgName?: string;
  orgCity?: string;
  orgState?: string;

  // Drive Details
  title: string;
  description: string;
  category: WorkCategory;

  // Location
  city: string;
  state: string;
  address: string;

  // Schedule
  date: Date;
  time: string; // e.g. "10:00 AM"
  durationHours?: number;

  // Requirements
  requiredVolunteers: number;
  maxVolunteers?: number; // Added for Prompt 2
  joinedVolunteers: number;
  instructions?: string;
  meetingLocation?: string;
  requiredOrgCategory?: string;

  // Link to issue (Prompt 2)
  issueId?: string;
  createdByAdmin?: string;

  // Org Acceptance (Prompt 2)
  acceptedOrgId?: mongoose.Types.ObjectId;
  acceptedOrgName?: string;
  orgAcceptedAt?: Date;
  orgApprovedAt?: Date;
  expiresAt?: Date; // 48-hour timeout
  orgRequests?: IOrgRequest[];

  // Volunteers and timeline (Prompt 2)
  volunteers?: IVolunteer[];
  driveTimeline?: IDriveTimeline[];
  isAttendanceLocked?: boolean;
  
  // Partner Requests (Prompt 5)
  partnerRequests?: {
    orgId: string;
    orgName: string;
    status: "pending" | "approved" | "rejected";
    requestedAt: Date;
  }[];

  // Status
  status: DriveStatus;
  cancelReason?: string;
  cancellationRequestedBy?: string;
  cancellationApprovedAt?: Date;

  // Completion data
  completionNotes?: string;
  completionImageUrl?: string; // legacy
  workPerformed?: string;
  hoursWorked?: number;
  totalVolunteersPresent?: number;
  afterImageUrls?: string[];
  videoUrls?: string[];
  wasteCollected?: number;
  treesPlanted?: number;
  awarenessParticipants?: number;
  additionalNotes?: string;
  completedAt?: Date;
  completedByOrgAt?: Date;

  isSelfInitiated?: boolean;

  // Prompt 4B Additions
  supportingOrgs?: string[];
  municipalContribution?: string;
  municipalEmployeeId?: string;
  aiImpactSummary?: string;

  createdAt: Date;
  updatedAt: Date;
}

const VolunteerDriveSchema = new Schema<IVolunteerDrive>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "VolunteerOrganization" },
    orgName: { type: String },
    orgCity: { type: String },
    orgState: { type: String },

    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Cleanliness",
        "Tree Plantation",
        "Plastic Collection",
        "Animal Welfare",
        "Awareness Campaign",
        "Wall Painting",
        "Park Cleaning",
        "Lake Cleaning",
        "River Cleaning",
        "Public Health",
        "Waste Segregation",
        "Other",
      ],
      required: true,
    },

    city: { type: String, required: true },
    state: { type: String, required: true },
    address: { type: String, required: true },

    date: { type: Date },
    time: { type: String },
    durationHours: { type: Number },

    requiredVolunteers: { type: Number, min: 1 },
    maxVolunteers: { type: Number },
    joinedVolunteers: { type: Number, default: 0 },
    instructions: { type: String },
    meetingLocation: { type: String },
    requiredOrgCategory: { type: String },

    issueId: { type: String },
    createdByAdmin: { type: String },
    
    acceptedOrgId: { type: Schema.Types.ObjectId, ref: "VolunteerOrganization" },
    acceptedOrgName: { type: String },
    orgAcceptedAt: { type: Date },
    orgApprovedAt: { type: Date },
    expiresAt: { type: Date },

    orgRequests: [{
      orgId: { type: Schema.Types.ObjectId, ref: "VolunteerOrganization" },
      orgName: { type: String },
      trustScore: { type: Number },
      completedDrives: { type: Number },
      category: { type: String },
      members: { type: Number },
      status: { type: String, enum: ["pending", "approved", "rejected", "declined"] },
      message: { type: String },
      requestedAt: { type: Date, default: Date.now },
      respondedAt: { type: Date }
    }],

    volunteers: [{
      userId: { type: String },
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      age: { type: Number, required: true },
      emergencyContact: { type: String },
      reasonForJoining: { type: String },
      previousDrives: { type: Number },
      previousHours: { type: Number },
      attendancePercentage: { type: Number },
      status: { type: String, enum: ["pending", "approved", "rejected", "completed"], default: "pending" },
      joinedAt: { type: Date, default: Date.now },
      attendance: { type: String, enum: ["present", "absent", "late", null] }
    }],

    driveTimeline: [{
      milestone: { type: String, required: true },
      note: { type: String },
      imageUrl: { type: String },
      postedAt: { type: Date, default: Date.now }
    }],

    partnerRequests: [{
      orgId: { type: String },
      orgName: { type: String },
      status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
      requestedAt: { type: Date, default: Date.now }
    }],

    isAttendanceLocked: { type: Boolean, default: false },

    status: {
      type: String,
      enum: [
        "OPEN", "CANCELLED", "COMPLETED", 
        "WAITING_FOR_ORG", "ORG_PENDING_APPROVAL", "ORG_APPROVED",
        "VOLUNTEER_REG_OPEN", "REG_CLOSED", "DRIVE_IN_PROGRESS",
        "DRIVE_COMPLETED", "ADMIN_VERIFICATION_PENDING", "VERIFIED",
        "FAILED", "OVERDUE"
      ],
      default: "OPEN",
    },
    cancelReason: { type: String },
    cancellationRequestedBy: { type: String },
    cancellationApprovedAt: { type: Date },

    completionNotes: { type: String },
    completionImageUrl: { type: String },
    workPerformed: { type: String },
    hoursWorked: { type: Number },
    totalVolunteersPresent: { type: Number },
    afterImageUrls: [{ type: String }],
    videoUrls: [{ type: String }],
    wasteCollected: { type: Number },
    treesPlanted: { type: Number },
    awarenessParticipants: { type: Number },
    additionalNotes: { type: String },
    completedAt: { type: Date },
    completedByOrgAt: { type: Date },

    isSelfInitiated: { type: Boolean, default: false },

    // Prompt 4B fields
    supportingOrgs: { type: [String], default: [] },
    municipalContribution: { type: String },
    municipalEmployeeId: { type: String },
    aiImpactSummary: { type: String },
  },
  { timestamps: true }
);

VolunteerDriveSchema.index({ orgId: 1 });
VolunteerDriveSchema.index({ issueId: 1 });
VolunteerDriveSchema.index({ city: 1, state: 1 });
VolunteerDriveSchema.index({ status: 1 });
VolunteerDriveSchema.index({ category: 1 });
VolunteerDriveSchema.index({ date: 1 });

if (mongoose.models.VolunteerDrive) {
  delete mongoose.models.VolunteerDrive;
}

export const VolunteerDrive = mongoose.model<IVolunteerDrive>(
  "VolunteerDrive",
  VolunteerDriveSchema
);
