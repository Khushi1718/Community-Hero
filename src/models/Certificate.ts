import mongoose, { Schema, Document } from "mongoose";

export interface ICertificate extends Document {
  certificateId: string;
  volunteerEmail: string;
  volunteerName: string;
  driveId: mongoose.Types.ObjectId;
  driveName?: string;
  orgId?: mongoose.Types.ObjectId;
  orgName?: string;
  issuedAt: Date;
  certificatePdfUrl?: string;
  certificateImageUrl?: string;
  verificationToken: string;
  status: "Pending" | "Generating" | "Generated" | "Sending" | "Sent" | "Failed" | "Retrying";
  errorLog?: string;
  emailSent: boolean;
  emailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    certificateId: { type: String, required: true, unique: true },
    volunteerEmail: { type: String, required: true },
    volunteerName: { type: String, required: true },
    driveId: { type: Schema.Types.ObjectId, ref: "VolunteerDrive", required: true },
    driveName: { type: String },
    orgId: { type: Schema.Types.ObjectId, ref: "VolunteerOrganization" },
    orgName: { type: String },
    issuedAt: { type: Date, default: Date.now },
    certificatePdfUrl: { type: String },
    certificateImageUrl: { type: String },
    verificationToken: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["Pending", "Generating", "Generated", "Sending", "Sent", "Failed", "Retrying"],
      default: "Pending",
    },
    errorLog: { type: String },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for faster lookups on Dashboard
CertificateSchema.index({ driveId: 1 });
CertificateSchema.index({ volunteerEmail: 1 });
CertificateSchema.index({ verificationToken: 1 });

export const Certificate = mongoose.models.Certificate || mongoose.model<ICertificate>("Certificate", CertificateSchema);

