import mongoose, { Schema, Document } from "mongoose";

export type CertificateType = "VOLUNTEER" | "ORG_EXCELLENCE";

export interface ICertificate extends Document {
  certificateId: string; // Unique, short readable ID like "CERT-12345"
  type: CertificateType;
  issuedToId: string; // User email or Org ID
  issuedToType: "citizen" | "organization";
  issuedToName: string;
  driveId?: string;
  driveName?: string;
  issueId?: string;
  orgId?: string;
  orgName?: string;
  locationCity?: string;
  hours?: number;
  geminiMessage?: string;
  qrCodeData: string; // Full URL or data to verify
  verificationUrl: string;
  isRevoked: boolean;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    certificateId: { type: String, required: true, unique: true },
    type: { type: String, enum: ["VOLUNTEER", "ORG_EXCELLENCE"], required: true },
    issuedToId: { type: String, required: true },
    issuedToType: { type: String, enum: ["citizen", "organization"], required: true },
    issuedToName: { type: String, required: true },
    driveId: { type: String },
    driveName: { type: String },
    issueId: { type: String },
    orgId: { type: String },
    orgName: { type: String },
    locationCity: { type: String },
    hours: { type: Number },
    geminiMessage: { type: String },
    qrCodeData: { type: String, required: true },
    verificationUrl: { type: String, required: true },
    isRevoked: { type: Boolean, default: false },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CertificateSchema.index({ issuedToId: 1, type: 1 });
CertificateSchema.index({ certificateId: 1 });

if (mongoose.models.Certificate) {
  delete mongoose.models.Certificate;
}

export const Certificate = mongoose.model<ICertificate>(
  "Certificate",
  CertificateSchema
);
