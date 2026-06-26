import mongoose, { Schema, Document } from "mongoose";

// Evidence item — can be image, video, PDF, GPS log, etc.
export interface IEvidence {
  url: string;          // base64 or URL
  type: "image" | "video" | "pdf" | "document" | "gps";
  category: "Site Visit" | "Inspection" | "Repair" | "Completion" | "Other";
  isPublic: boolean;    // false = internal only (hidden from citizens)
  uploadedBy: string;   // actorName
  uploadedByRole: string;
  caption?: string;
  uploadedAt: Date;
}

export interface IStatusHistory {
  status: string;
  timestamp: Date;
  actorName?: string;
  actorRole?: string;
}

export interface IIssue extends Document {
  issueId: string;
  title: string;
  description: string;
  priority: string;
  status: string;

  location: {
    type: "Point";
    coordinates: [number, number];
    address: string;
    state?: string;
    city?: string;
  };

  reportedBy?: mongoose.Types.ObjectId;
  reportedByName?: string;
  isPublicRecognitionEnabled?: boolean;
  citizenEmail?: string;
  deviceInfo?: string;
  browserInfo?: string;

  assignedTo?: mongoose.Types.ObjectId;
  assignedToName?: string;
  assignedDepartment?: string;
  assignedAdmin?: mongoose.Types.ObjectId;
  assignedAdminName?: string;

  assignedAt?: Date;
  acceptedAt?: Date;
  resolvedAt?: Date;

  imageUrl?: string;

  // Evidence array — replaces single resolutionProof
  evidences: IEvidence[];

  // Legacy resolution proof (keep for backward compat)
  resolutionProof?: {
    imageBase64: string;
    notes: string;
    timeTaken?: string;
    materialUsed?: string;
  };

  materialRequests?: {
    material: string;
    quantity: number;
    reason: string;
    priority: string;
    evidenceUrl?: string;
    notes?: string;
    status: "Pending" | "Approved" | "Rejected";
    adminNotes?: string;
    expectedDeliveryDate?: Date;
    supplier?: string;
    requestedAt: Date;
    actionedAt?: Date;
  }[];

  rejectionReason?: string;
  transferredTo?: string;
  assistanceRequested?: boolean;

  communityDriveId?: string;
  employeeHoldReason?: string;

  aiAnalysis: {
    confidenceScore: number;
    urgencyScore: number;
    isFake: boolean;
    summary?: string;
    category?: string;
    department?: string;
    severity?: string;
    severityReason?: string;
  };

  resolutionVerification?: {
    isResolved: boolean;
    confidence: number;
    reasoning: string;
  };

  verificationScore?: number;
  cameraSource?: "Level 1 (In-App)" | "Level 2 (Gallery Upload)";

  progressPercentage?: number;
  expectedCompletionTime?: Date;

  // Status history for audit trail
  statusHistory: IStatusHistory[];

  citizenFeedback?: {
    rating: number;
    comment: string;
    submittedAt?: Date;
  };

  upvotes: number;
  upvotedBy: string[];
  isOverdue: boolean;

  // Prompt 4B Additions
  adoptedAreaId?: string;
  isEmergency?: boolean;

  // AI Resolution Verification
  resolutionVerification?: {
    isResolved: boolean;
    confidence: number;
    reasoning: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const EvidenceSchema = new Schema<IEvidence>(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video", "pdf", "document", "gps"], default: "image" },
    category: { type: String, enum: ["Site Visit", "Inspection", "Repair", "Completion", "Other"], default: "Other" },
    isPublic: { type: Boolean, default: false },
    uploadedBy: { type: String },
    uploadedByRole: { type: String },
    caption: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const StatusHistorySchema = new Schema<IStatusHistory>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    actorName: { type: String },
    actorRole: { type: String }
  },
  { _id: false }
);

const IssueSchema = new Schema<IIssue>(
  {
    issueId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, default: "P3_Medium" },
    status: { type: String, default: "Reported" },

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
      address: { type: String, required: true },
      state: { type: String },
      city: { type: String }
    },

    reportedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reportedByName: { type: String },
    isPublicRecognitionEnabled: { type: Boolean, default: false },
    citizenEmail: { type: String },
    deviceInfo: { type: String },
    browserInfo: { type: String },

    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    assignedToName: { type: String },
    assignedDepartment: { type: String },
    assignedAdmin: { type: Schema.Types.ObjectId, ref: "User" },
    assignedAdminName: { type: String },

    assignedAt: { type: Date },
    acceptedAt: { type: Date },
    resolvedAt: { type: Date },

    imageUrl: { type: String },

    evidences: [EvidenceSchema],

    resolutionProof: {
      imageBase64: { type: String },
      notes: { type: String },
      timeTaken: { type: String },
      materialUsed: { type: String }
    },

    materialRequests: [{
      material: { type: String, required: true },
      quantity: { type: Number, required: true },
      reason: { type: String, required: true },
      priority: { type: String, default: "Medium" },
      evidenceUrl: { type: String },
      notes: { type: String },
      status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
      adminNotes: { type: String },
      expectedDeliveryDate: { type: Date },
      supplier: { type: String },
      requestedAt: { type: Date, default: Date.now },
      actionedAt: { type: Date }
    }],

    rejectionReason: { type: String },
    transferredTo: { type: String },
    assistanceRequested: { type: Boolean, default: false },

    communityDriveId: { type: String },
    employeeHoldReason: { type: String },

    aiAnalysis: {
      confidenceScore: { type: Number, default: 0 },
      urgencyScore: { type: Number, default: 0 },
      isFake: { type: Boolean, default: false },
      summary: { type: String },
      category: { type: String },
      department: { type: String },
      severity: { type: String }
    },

    resolutionVerification: {
      isResolved: { type: Boolean },
      confidence: { type: Number },
      reasoning: { type: String }
    },

    verificationScore: { type: Number },
    cameraSource: { type: String, enum: ["Level 1 (In-App)", "Level 2 (Gallery Upload)"] },

    progressPercentage: { type: Number, default: 0 },
    expectedCompletionTime: { type: Date },

    statusHistory: [StatusHistorySchema],

    citizenFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      submittedAt: { type: Date }
    },

    upvotes: { type: Number, default: 0 },
    upvotedBy: { type: [String], default: [] },
    isOverdue: { type: Boolean, default: false },

    adoptedAreaId: { type: String },
    isEmergency: { type: Boolean, default: false }
  },
  { timestamps: true }
);

IssueSchema.index({ location: "2dsphere" });
IssueSchema.index({ citizenEmail: 1 });
IssueSchema.index({ assignedTo: 1, status: 1 });
IssueSchema.index({ assignedAdmin: 1, status: 1 });
IssueSchema.index({ "location.state": 1, "location.city": 1 });

if (mongoose.models.Issue) {
  delete mongoose.models.Issue;
}
export const Issue = mongoose.model<IIssue>("Issue", IssueSchema);
