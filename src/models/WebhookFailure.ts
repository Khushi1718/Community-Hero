import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWebhookFailure extends Document {
  ticketId: string;
  cityId: string;
  error: string;
  attempts: number;
  timestamp: Date;
}

const WebhookFailureSchema = new Schema<IWebhookFailure>({
  ticketId: { type: String, required: true, index: true },
  cityId: { type: String, required: true, index: true },
  error: { type: String, required: true },
  attempts: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const WebhookFailure: Model<IWebhookFailure> =
  mongoose.models.WebhookFailure || mongoose.model<IWebhookFailure>("WebhookFailure", WebhookFailureSchema);
