import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  actionType: string;
  actorEmail: string;
  actorRole: string;
  targetEntityId?: string;
  targetEntityType?: string;
  metadata?: any;
  status: "SUCCESS" | "FAILURE";
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actionType: { type: String, required: true },
    actorEmail: { type: String, required: true },
    actorRole: { type: String, required: true },
    targetEntityId: { type: String },
    targetEntityType: { type: String },
    metadata: { type: Schema.Types.Mixed },
    status: { type: String, enum: ["SUCCESS", "FAILURE"], default: "SUCCESS" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
