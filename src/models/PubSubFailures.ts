import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPubSubFailure extends Document {
  issueId: string;
  topicName: string;
  payload: any;
  error: string;
  createdAt: Date;
  resolved: boolean;
}

const PubSubFailureSchema = new Schema<IPubSubFailure>(
  {
    issueId: {
      type: String,
      required: true,
      index: true,
    },
    topicName: {
      type: String,
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    error: {
      type: String,
      required: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const PubSubFailure: Model<IPubSubFailure> =
  mongoose.models.PubSubFailure ||
  mongoose.model<IPubSubFailure>("PubSubFailure", PubSubFailureSchema);
