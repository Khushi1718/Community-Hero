import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  clerkId?: string;
  email: string;
  name: string;
  role: "citizen" | "employee" | "admin" | "super_admin";
  status: "active" | "suspended" | "on_leave";
  
  // Location Hierarchy
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  ward?: string;
  area?: string;

  // Employee/Admin Specific
  departmentId?: mongoose.Types.ObjectId;
  department?: string; // Fallback string representation
  skills?: string[];
  
  // Availability / Duty Status (used by admin/employee)
  isAvailable?: boolean;

  // Tracks which admin created this employee (for admin-scoped employee filtering)
  createdByAdmin?: string;
  
  // Metrics & Trust
  trustScore?: number;
  performanceScore?: number;
  
  // Custom password for mock staff logins (since we use local auth for staff)
  password?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["citizen", "employee", "admin", "super_admin"], required: true },
    status: { type: String, enum: ["active", "suspended", "on_leave"], default: "active" },
    
    country: { type: String },
    state: { type: String },
    district: { type: String },
    city: { type: String },
    ward: { type: String },
    area: { type: String },

    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    department: { type: String },
    skills: [{ type: String }],
    
    isAvailable: { type: Boolean, default: true },
    createdByAdmin: { type: String },
    
    trustScore: { type: Number, default: 100 },
    performanceScore: { type: Number, default: 100 },
    
    password: { type: String }
  },
  { timestamps: true }
);

if (mongoose.models.User) {
  delete mongoose.models.User;
}
export const User = mongoose.model<IUser>("User", UserSchema);
