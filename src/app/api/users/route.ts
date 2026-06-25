import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { User } from "@/models/User";

// GET all users (can be filtered via query params)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const email = searchParams.get("email");
    const createdByAdmin = searchParams.get("createdByAdmin");
    
    let query: any = {};
    if (role) {
      query.role = role;
    }
    if (email) {
      // Case-insensitive email lookup
      query.email = { $regex: new RegExp(`^${email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    }
    if (createdByAdmin) {
      query.createdByAdmin = createdByAdmin;
    }
    
    // Never expose passwords in list/search responses
    const users = await User.find(query).select("-password").sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST to create or sync a user
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    // Normalize email to lowercase to prevent case-mismatch duplicates
    if (body.email) {
      body.email = body.email.toLowerCase().trim();
    }

    if (body.email) {
      // Case-insensitive lookup
      const existingUser = await User.findOne({
        email: { $regex: new RegExp(`^${body.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });

      if (existingUser) {
        // Build a safe update — only update fields that are explicitly provided
        // NEVER downgrade role (e.g., don't let citizen seed overwrite admin)
        // NEVER overwrite password with empty/undefined
        const safeUpdate: any = {};
        
        if (body.name) safeUpdate.name = body.name;
        if (body.state !== undefined) safeUpdate.state = body.state;
        if (body.city !== undefined) safeUpdate.city = body.city;
        if (body.department !== undefined) safeUpdate.department = body.department;
        if (body.isAvailable !== undefined) safeUpdate.isAvailable = body.isAvailable;
        if (body.createdByAdmin !== undefined) safeUpdate.createdByAdmin = body.createdByAdmin;
        if (body.skills) safeUpdate.skills = body.skills;
        if (body.trustScore !== undefined) safeUpdate.trustScore = body.trustScore;
        if (body.performanceScore !== undefined) safeUpdate.performanceScore = body.performanceScore;
        
        // Only update password if a non-empty password is explicitly provided
        if (body.password && body.password.trim() !== '') {
          safeUpdate.password = body.password;
        }
        
        // CRITICAL: Only allow role upgrades from citizen, never downgrade staff roles
        const staffRoles = ['admin', 'employee', 'super_admin'];
        const isExistingStaff = staffRoles.includes(existingUser.role);
        const isIncomingCitizen = body.role === 'citizen';
        if (body.role && !(isExistingStaff && isIncomingCitizen)) {
          safeUpdate.role = body.role;
        }
        
        const updated = await User.findOneAndUpdate(
          { _id: existingUser._id },
          { $set: safeUpdate },
          { new: true }
        ).select('-password');
        return NextResponse.json(updated);
      }
    }
    
    // Create new user
    const newUser = await User.create(body);
    const userObj = newUser.toObject();
    delete (userObj as any).password;
    return NextResponse.json(userObj, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (email) {
      await User.findOneAndDelete({ email });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
