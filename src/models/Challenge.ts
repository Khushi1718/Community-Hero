import mongoose, { Schema, Document } from "mongoose";

export interface IChallenge extends Document {
  title: string;
  description: string;
  category: string;
  startDate: Date;
  endDate: Date;
  pointsReward: number;
  isActive: boolean;
  participants: {
    userId: string;
    orgId?: string;
    progress: number;
    completed: boolean;
    dateJoined: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema = new Schema<IChallenge>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    pointsReward: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    participants: [
      {
        userId: { type: String, required: true },
        orgId: { type: String },
        progress: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
        dateJoined: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Challenge ||
  mongoose.model<IChallenge>("Challenge", ChallengeSchema);
