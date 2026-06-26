import mongoose, { Schema, Document } from "mongoose";

export interface IAdoptedArea extends Document {
  name: string;
  location: string;
  state: string;
  city: string;
  organizationId: string;
  reason: string;
  durationMonths: number;
  maintenancePlan: string;
  photos: string[];
  status: "PENDING" | "ADOPTED" | "REJECTED";
  startDate?: Date;
  endDate?: Date;
  citizenFeedback: { rating: number; comment: string; date: Date }[];
  maintenanceHistory: { action: string; date: Date; notes?: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const AdoptedAreaSchema = new Schema<IAdoptedArea>(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    organizationId: { type: String, required: true },
    reason: { type: String, required: true },
    durationMonths: { type: Number, required: true },
    maintenancePlan: { type: String, required: true },
    photos: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["PENDING", "ADOPTED", "REJECTED"],
      default: "PENDING",
    },
    startDate: { type: Date },
    endDate: { type: Date },
    citizenFeedback: [
      {
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
    maintenanceHistory: [
      {
        action: { type: String, required: true },
        date: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.AdoptedArea ||
  mongoose.model<IAdoptedArea>("AdoptedArea", AdoptedAreaSchema);
