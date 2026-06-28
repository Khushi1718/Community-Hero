import mongoose, { Schema, Document, Model } from "mongoose";

export interface IIntegrationConfig extends Document {
  cityId: string;
  enabled: boolean;
  webhookUrl: string;
  authType: "none" | "bearer" | "apiKey" | "basic";
  authTokenEncrypted?: string;
  fieldMapping?: Record<string, string>;
  pubSubEnabled?: boolean;
  pubSubTopic?: string;
  pubSubServiceAccountKeyEncrypted?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationConfigSchema = new Schema<IIntegrationConfig>(
  {
    cityId: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false },
    webhookUrl: { type: String, required: false },
    authType: { 
      type: String, 
      enum: ["none", "bearer", "apiKey", "basic"], 
      default: "none" 
    },
    authTokenEncrypted: { type: String },
    fieldMapping: { type: Map, of: String },
    pubSubEnabled: {
      type: Boolean,
      default: false,
    },
    pubSubTopic: {
      type: String,
    },
    pubSubServiceAccountKeyEncrypted: {
      type: String,
    },
    lastModifiedBy: {
      type: String,
    },
    lastModifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const IntegrationConfig: Model<IIntegrationConfig> =
  mongoose.models.IntegrationConfig || mongoose.model<IIntegrationConfig>("IntegrationConfig", IntegrationConfigSchema);
