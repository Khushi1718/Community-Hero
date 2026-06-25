import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId: string; // Refers to User._id or email depending on implementation
  issueId?: string; // Optional reference to the related issue
  title: string;
  message: string;
  type: "Assignment" | "Status_Update" | "Citizen_Action" | "System";
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    issueId: { type: String },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["Assignment", "Status_Update", "Citizen_Action", "System"], default: "System" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}
export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
