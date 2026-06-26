import mongoose, { Schema, Document } from "mongoose";

export interface IFeedback extends Document {
  citizenId: string; // citizen email
  orgId: mongoose.Types.ObjectId;
  driveId: mongoose.Types.ObjectId;
  rating: number; // 1 to 5
  comment?: string;
  isReviewed: boolean;
  adminActionTaken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    citizenId: { type: String, required: true },
    orgId: { type: Schema.Types.ObjectId, ref: "VolunteerOrganization", required: true },
    driveId: { type: Schema.Types.ObjectId, ref: "VolunteerDrive", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    isReviewed: { type: Boolean, default: false },
    adminActionTaken: { type: String },
  },
  { timestamps: true }
);

FeedbackSchema.index({ orgId: 1 });
FeedbackSchema.index({ citizenId: 1 });
FeedbackSchema.index({ driveId: 1 });

if (mongoose.models.Feedback) {
  delete mongoose.models.Feedback;
}

export const Feedback = mongoose.model<IFeedback>("Feedback", FeedbackSchema);
