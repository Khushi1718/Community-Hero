import mongoose, { Schema, Document } from "mongoose";

export interface ILike {
  userId: string;  // email or user._id string
  createdAt: Date;
}

export interface IComment {
  userId: string;
  userName: string;
  text: string;
  isHidden?: boolean;
  reportedBy?: string[];
  createdAt: Date;
}

export interface ICommunityPost extends Document {
  postType: "Issue_Based" | "Self_Initiated" | "Municipal_Success";
  
  issueId?: string; // Optional for self-initiated
  issueRef?: mongoose.Types.ObjectId;
  
  driveId?: mongoose.Types.ObjectId;
  orgId?: mongoose.Types.ObjectId;
  orgName?: string;
  orgLogoUrl?: string;
  
  departmentName?: string;
  employeeName?: string;

  title: string;
  category?: string;
  beforeImageUrl?: string; // legacy
  afterImageUrl?: string; // legacy
  
  beforeImageUrls?: string[];
  afterImageUrls?: string[];
  videoUrls?: string[];

  location: {
    address: string;
    city?: string;
    state?: string;
  };
  department?: string; // Made optional since orgs handle community drives
  reportedByName?: string;
  resolvedByName?: string;
  resolutionSummary: string;
  
  impactMetrics?: {
    volunteerCount?: number;
    volunteerHours?: number;
    wasteCollected?: number;
    treesPlanted?: number;
    awarenessParticipants?: number;
  };

  reportedAt?: Date;
  resolvedAt: Date;
  completedAt?: Date;
  resolutionTimeHours?: number;
  verificationStatus: "Verified" | "Community_Approved";

  // Engagement
  upvotes: number;         // legacy
  likes: ILike[];          
  comments: IComment[];
  views: number;
  bookmarks: { userId: string }[];

  // Corrections
  correctionRequest?: {
    requestedAt: Date;
    details: string;
    status: "pending" | "approved" | "rejected";
    reviewedAt?: Date;
    adminMessage?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    userId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const CommentSchema = new Schema<IComment>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
    reportedBy: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    postType: { type: String, enum: ["Issue_Based", "Self_Initiated", "Municipal_Success"], default: "Issue_Based" },
    
    issueId: { type: String }, // Removed unique: true and required: true
    issueRef: { type: Schema.Types.ObjectId, ref: "Issue" },
    
    driveId: { type: Schema.Types.ObjectId, ref: "VolunteerDrive" },
    orgId: { type: Schema.Types.ObjectId, ref: "VolunteerOrganization" },
    orgName: { type: String },
    orgLogoUrl: { type: String },
    
    departmentName: { type: String },
    employeeName: { type: String },

    title: { type: String, required: true },
    category: { type: String },
    beforeImageUrl: { type: String },
    afterImageUrl: { type: String },
    
    beforeImageUrls: [{ type: String }],
    afterImageUrls: [{ type: String }],
    videoUrls: [{ type: String }],

    location: {
      address: { type: String, required: true },
      city: { type: String },
      state: { type: String }
    },
    department: { type: String },
    reportedByName: { type: String },
    resolvedByName: { type: String },
    resolutionSummary: { type: String, required: true },
    
    impactMetrics: {
      volunteerCount: { type: Number },
      volunteerHours: { type: Number },
      wasteCollected: { type: Number },
      treesPlanted: { type: Number },
      awarenessParticipants: { type: Number },
    },

    reportedAt: { type: Date },
    resolvedAt: { type: Date, required: true },
    completedAt: { type: Date },
    resolutionTimeHours: { type: Number },
    verificationStatus: { type: String, enum: ["Verified", "Community_Approved"], default: "Verified" },
    upvotes: { type: Number, default: 0 },
    likes: [LikeSchema],
    comments: [CommentSchema],
    views: { type: Number, default: 0 },
    bookmarks: [{ userId: { type: String } }],
    
    correctionRequest: {
      requestedAt: { type: Date },
      details: { type: String },
      status: { type: String, enum: ["pending", "approved", "rejected"] },
      reviewedAt: { type: Date },
      adminMessage: { type: String }
    }
  },
  { timestamps: true }
);

CommunityPostSchema.index({ "location.state": 1, "location.city": 1 });
CommunityPostSchema.index({ resolvedAt: -1 });

if (mongoose.models.CommunityPost) {
  delete mongoose.models.CommunityPost;
}
export const CommunityPost = mongoose.model<ICommunityPost>("CommunityPost", CommunityPostSchema);
