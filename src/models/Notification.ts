import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId: string; // Refers to User._id or email depending on implementation
  orgId?: string; // Optional reference to a VolunteerOrganization (by _id string)
  issueId?: string; // Optional reference to the related issue
  title: string;
  message: string;
  type:
    | "Assignment"
    | "Status_Update"
    | "Citizen_Action"
    | "System"
    | "Org_Verification"
    | "Org_Drive"
    | "Org_Volunteer"
    | "Org_Admin_Message"
    | "Drive_Invitation"
    | "Drive_Org_Accepted"
    | "Drive_Org_Approved"
    | "Drive_Org_Rejected"
    | "Drive_Volunteer_Joined"
    | "Drive_Volunteer_Removed"
    | "Drive_Rescheduled"
    | "Drive_Volunteer_Full"
    | "Drive_Volunteer_Cancelled"
    | "Drive_Started"
    | "Drive_Completed"
    | "Drive_Cancelled"
    | "Drive_Failed"
    | "Drive_Reminder"
    | "Drive_Overdue"
    | "Org_Suspended_Mid_Drive"
    | "Org_Membership_Request"
    | "Org_Member_Approved"
    | "Org_Member_Declined"
    | "Org_Member_Removed"
    | "Org_Announcement"
    | "Org_Completion_Approved"
    | "Story_Published"
    | "Story_Featured"
    | "Citizen_Report_Published"
    | "Story_Correction_Approved"
    | "Story_Correction_Rejected"
    | "Achievement"
    | "Certificate";
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    orgId: { type: String, index: true },
    issueId: { type: String },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "Assignment",
        "Status_Update",
        "Citizen_Action",
        "System",
        "Org_Verification",
        "Org_Drive",
        "Org_Volunteer",
        "Org_Admin_Message",
        "Drive_Invitation",
        "Drive_Org_Accepted",
        "Drive_Org_Approved",
        "Drive_Org_Rejected",
        "Drive_Volunteer_Joined",
        "Drive_Volunteer_Removed",
        "Drive_Rescheduled",
        "Drive_Volunteer_Full",
        "Drive_Volunteer_Cancelled",
        "Drive_Started",
        "Drive_Completed",
        "Drive_Cancelled",
        "Drive_Failed",
        "Drive_Reminder",
        "Drive_Overdue",
        "Org_Suspended_Mid_Drive",
        "Org_Membership_Request",
        "Org_Member_Approved",
        "Org_Member_Declined",
        "Org_Member_Removed",
        "Org_Announcement",
        "Org_Completion_Approved",
        "Story_Published",
        "Story_Featured",
        "Citizen_Report_Published",
        "Story_Correction_Approved",
        "Story_Correction_Rejected",
        "Achievement",
        "Certificate"
      ],
      default: "System",
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}
export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
