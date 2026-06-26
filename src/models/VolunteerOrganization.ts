import mongoose, { Schema, Document } from "mongoose";

export type OrgStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "SUSPENDED";

export type OrgType =
  | "NGO"
  | "NSS"
  | "NCC"
  | "Youth Club"
  | "RWA"
  | "Environmental Organization"
  | "Animal Welfare Organization"
  | "Cleanliness Group"
  | "Social Service Group"
  | "Other";

export const WORK_CATEGORIES = [
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
] as const;

export type WorkCategory = (typeof WORK_CATEGORIES)[number];

export interface IVerificationHistory {
  action: "approved" | "rejected" | "suspended" | "reactivated" | "info_requested";
  actorEmail: string;
  actorName: string;
  actorRole: "admin" | "super_admin";
  message?: string;
  timestamp: Date;
}

export interface IVolunteerMember {
  userId?: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  skills: string;
  availability: string;
  motivation: string;
  status: "pending" | "approved" | "rejected" | "member";
  previousDrives?: number;
  previousHours?: number;
  attendancePercentage?: number;
  joinedAt: Date;
}

export interface IOrgAnnouncement {
  title: string;
  message: string;
  target: string; // "all_members" or a specific driveId
  postedBy: string;
  postedAt: Date;
}

export interface IVolunteerOrganization extends Document {
  // Basic Info
  name: string;
  type: OrgType;
  registrationNumber?: string;
  description: string;
  mission?: string;

  // Location
  city: string;
  state: string;
  address: string;

  // Contact
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;

  // Details
  activeMembers: number;
  website?: string;
  logoUrl?: string;
  coverImageUrl?: string;

  // Work Categories
  workCategories: WorkCategory[];

  // Working areas (cities/districts)
  workingAreas?: string[];

  // Gallery
  gallery?: string[];

  // Status & Verification
  status: OrgStatus;
  rejectionReason?: string;
  adminMessage?: string;
  verificationHistory: IVerificationHistory[];

  // Assigned admin (for city-scoped admin verification)
  assignedAdmin?: string;

  // Trust Score — starts at 50
  trustScore: number;

  // Auth
  password: string;

  // Prompt 2 Extensions
  mustChangePassword?: boolean;
  verifiedBy?: string;
  verifiedByRole?: string;
  verifiedAt?: Date;
  completedDrivesCount?: number;
  username?: string;
  lastLoginAt?: Date;
  creatorInfo?: string;

  createdAt: Date;
  updatedAt: Date;

  // Prompt 3A Extensions
  members?: IVolunteerMember[];
  announcements?: IOrgAnnouncement[];

  // Gamification (Prompt 4A)
  points: number;
  totalVolunteerHours: number;
  badges: string[];
  achievements: { name: string; unlockedAt: Date }[];
}

const VerificationHistorySchema = new Schema<IVerificationHistory>(
  {
    action: {
      type: String,
      enum: ["approved", "rejected", "suspended", "reactivated", "info_requested"],
      required: true,
    },
    actorEmail: { type: String, required: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, enum: ["admin", "super_admin"], required: true },
    message: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const VolunteerOrganizationSchema = new Schema<IVolunteerOrganization>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "NGO",
        "NSS",
        "NCC",
        "Youth Club",
        "RWA",
        "Environmental Organization",
        "Animal Welfare Organization",
        "Cleanliness Group",
        "Social Service Group",
        "Other",
      ],
      required: true,
    },
    registrationNumber: { type: String },
    description: { type: String, required: true },
    mission: { type: String },

    city: { type: String, required: true },
    state: { type: String, required: true },
    address: { type: String, required: true },

    contactPersonName: { type: String, required: true },
    contactEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
    contactPhone: { type: String, required: true },

    activeMembers: { type: Number, required: true, min: 1 },
    website: { type: String },
    logoUrl: { type: String },
    coverImageUrl: { type: String },

    workCategories: [{ type: String, enum: WORK_CATEGORIES }],
    workingAreas: [{ type: String }],
    gallery: [{ type: String }],

    status: {
      type: String,
      enum: ["PENDING_VERIFICATION", "VERIFIED", "REJECTED", "SUSPENDED"],
      default: "PENDING_VERIFICATION",
    },
    rejectionReason: { type: String },
    adminMessage: { type: String },
    verificationHistory: [VerificationHistorySchema],

    assignedAdmin: { type: String },

    trustScore: { type: Number, default: 50, min: 0, max: 100 },

    password: { type: String, required: true },
    
    mustChangePassword: { type: Boolean, default: false },
    verifiedBy: { type: String },
    verifiedByRole: { type: String },
    verifiedAt: { type: Date },
    completedDrivesCount: { type: Number, default: 0 },
    username: { type: String, unique: true, sparse: true },
    lastLoginAt: { type: Date },
    creatorInfo: { type: String },
    
    members: [{
      userId: { type: String },
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      age: { type: Number, required: true },
      skills: { type: String },
      availability: { type: String },
      motivation: { type: String },
      status: { type: String, enum: ["pending", "approved", "rejected", "member"], default: "pending" },
      previousDrives: { type: Number },
      previousHours: { type: Number },
      attendancePercentage: { type: Number },
      joinedAt: { type: Date, default: Date.now }
    }],
    
    announcements: [{
      title: { type: String, required: true },
      message: { type: String, required: true },
      target: { type: String, required: true },
      postedBy: { type: String, required: true },
      postedAt: { type: Date, default: Date.now }
    }],
    
    points: { type: Number, default: 0 },
    totalVolunteerHours: { type: Number, default: 0 },
    badges: [{ type: String }],
    achievements: [{
      name: { type: String, required: true },
      unlockedAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

VolunteerOrganizationSchema.index({ city: 1, state: 1 });
VolunteerOrganizationSchema.index({ status: 1 });
VolunteerOrganizationSchema.index({ contactEmail: 1 });
VolunteerOrganizationSchema.index({ workCategories: 1 });

if (mongoose.models.VolunteerOrganization) {
  delete mongoose.models.VolunteerOrganization;
}

export const VolunteerOrganization = mongoose.model<IVolunteerOrganization>(
  "VolunteerOrganization",
  VolunteerOrganizationSchema
);
