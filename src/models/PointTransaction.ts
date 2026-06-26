import mongoose, { Schema, Document } from "mongoose";

export interface IPointTransaction extends Document {
  targetId: string; // User email or Org ID
  targetType: "citizen" | "organization";
  points: number;
  reason: string;
  referenceId?: string; // driveId or issueId
  isReversal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PointTransactionSchema = new Schema<IPointTransaction>(
  {
    targetId: { type: String, required: true },
    targetType: { type: String, enum: ["citizen", "organization"], required: true },
    points: { type: Number, required: true },
    reason: { type: String, required: true },
    referenceId: { type: String },
    isReversal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PointTransactionSchema.index({ targetId: 1, targetType: 1 });
PointTransactionSchema.index({ createdAt: -1 });

if (mongoose.models.PointTransaction) {
  delete mongoose.models.PointTransaction;
}

export const PointTransaction = mongoose.model<IPointTransaction>(
  "PointTransaction",
  PointTransactionSchema
);
