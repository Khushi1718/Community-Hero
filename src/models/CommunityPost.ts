import mongoose, { Schema, Document } from "mongoose";

export interface ILike {
  userId: string;  // email or user._id string
  createdAt: Date;
}

export interface IComment {
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
}

export interface ICommunityPost extends Document {
  issueId: string;
  issueRef: mongoose.Types.ObjectId;
  title: string;
  category?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  location: {
    address: string;
    city?: string;
    state?: string;
  };
  department: string;
  reportedByName?: string;
  resolvedByName?: string;
  resolutionSummary: string;
  reportedAt?: Date;
  resolvedAt: Date;
  completedAt?: Date;
  resolutionTimeHours?: number;
  verificationStatus: "Verified" | "Community_Approved";

  // Engagement — all persisted to MongoDB
  upvotes: number;         // legacy count field
  likes: ILike[];          // full like records
  comments: IComment[];
  views: number;

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
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    issueId: { type: String, required: true, unique: true },
    issueRef: { type: Schema.Types.ObjectId, ref: "Issue", required: true },
    title: { type: String, required: true },
    category: { type: String },
    beforeImageUrl: { type: String },
    afterImageUrl: { type: String },
    location: {
      address: { type: String, required: true },
      city: { type: String },
      state: { type: String }
    },
    department: { type: String, required: true },
    reportedByName: { type: String },
    resolvedByName: { type: String },
    resolutionSummary: { type: String, required: true },
    reportedAt: { type: Date },
    resolvedAt: { type: Date, required: true },
    completedAt: { type: Date },
    resolutionTimeHours: { type: Number },
    verificationStatus: { type: String, enum: ["Verified", "Community_Approved"], default: "Verified" },
    upvotes: { type: Number, default: 0 },
    likes: [LikeSchema],
    comments: [CommentSchema],
    views: { type: Number, default: 0 }
  },
  { timestamps: true }
);

CommunityPostSchema.index({ "location.state": 1, "location.city": 1 });
CommunityPostSchema.index({ resolvedAt: -1 });

if (mongoose.models.CommunityPost) {
  delete mongoose.models.CommunityPost;
}
export const CommunityPost = mongoose.model<ICommunityPost>("CommunityPost", CommunityPostSchema);
