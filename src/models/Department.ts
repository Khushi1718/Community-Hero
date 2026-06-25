import mongoose, { Schema, Document } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  description?: string;
  slaRules: {
    P1_Critical: number; // in hours
    P2_High: number;
    P3_Medium: number;
    P4_Low: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    slaRules: {
      P1_Critical: { type: Number, default: 6 }, // 6 hours
      P2_High: { type: Number, default: 24 },    // 24 hours
      P3_Medium: { type: Number, default: 48 },  // 48 hours
      P4_Low: { type: Number, default: 168 }     // 7 days
    }
  },
  { timestamps: true }
);

export const Department = mongoose.models.Department || mongoose.model<IDepartment>("Department", DepartmentSchema);
