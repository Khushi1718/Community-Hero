import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWebhookLog extends Document {
  ticketId: string;
  cityId: string;
  endpoint: string;
  status: "success" | "failure";
  responseCode?: number;
  responseBody?: string;
  errorMessage?: string;
  timestamp: Date;
}

const WebhookLogSchema = new Schema<IWebhookLog>({
  ticketId: { type: String, required: true, index: true },
  cityId: { type: String, required: true, index: true },
  endpoint: { type: String, required: true },
  status: { type: String, enum: ["success", "failure"], required: true },
  responseCode: { type: Number },
  responseBody: { type: String },
  errorMessage: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export const WebhookLog: Model<IWebhookLog> =
  mongoose.models.WebhookLog || mongoose.model<IWebhookLog>("WebhookLog", WebhookLogSchema);
