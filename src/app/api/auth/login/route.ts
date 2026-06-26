import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { User } from "@/models/User";
import { VolunteerOrganization } from "@/models/VolunteerOrganization";

/**
 * POST /api/auth/login
 * Secure staff login endpoint.
 * Accepts { email, password }, validates credentials server-side,
 * and returns the user object (without password) on success.
 * Also supports VolunteerOrganization login by contactEmail.
 * Passwords are NEVER returned to the client.
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Normalize email and do case-insensitive lookup
    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    // --- Check User table first (admin, employee, super_admin) ---
    const user = await User.findOne({ email: { $regex: emailRegex } }).select("+password");

    if (user) {
      // Only staff roles can use this endpoint (citizens use Clerk)
      if (!["admin", "employee", "super_admin"].includes(user.role)) {
        return NextResponse.json(
          { error: "Citizens must sign in via the Clerk sign-in form above." },
          { status: 403 }
        );
      }

      if (!user.password) {
        return NextResponse.json(
          { error: "No password set for this account. Contact your administrator." },
          { status: 401 }
        );
      }

      // Plain-text comparison (demo/prototype — use bcrypt in production)
      if (user.password !== password) {
        return NextResponse.json(
          { error: "Incorrect password. Please try again." },
          { status: 401 }
        );
      }

      if (user.status === "suspended") {
        return NextResponse.json(
          { error: "This account has been suspended. Contact your administrator." },
          { status: 403 }
        );
      }

      // Return user data WITHOUT password
      const userObj = user.toObject();
      delete (userObj as any).password;

      return NextResponse.json({ success: true, user: userObj }, { status: 200 });
    }

    // --- Check VolunteerOrganization table ---
    const org = await VolunteerOrganization.findOne({ contactEmail: { $regex: emailRegex } }).select("+password");

    if (org) {
      if (!org.password) {
        return NextResponse.json(
          { error: "No password set for this organization. Contact support." },
          { status: 401 }
        );
      }

      if (org.password !== password) {
        return NextResponse.json(
          { error: "Incorrect password. Please try again." },
          { status: 401 }
        );
      }

      if (org.status === "SUSPENDED") {
        return NextResponse.json(
          { error: "This organization has been suspended. Contact the administrator." },
          { status: 403 }
        );
      }

      // Return a user-compatible shape with role = volunteer_org
      const orgObj: any = {
        _id: org._id,
        email: org.contactEmail,
        name: org.name,
        role: "volunteer_org",
        status: org.status,
        city: org.city,
        state: org.state,
        orgId: org._id,
      };

      return NextResponse.json({ success: true, user: orgObj }, { status: 200 });
    }

    // Not found in either table
    return NextResponse.json(
      { error: "Account not found. Check your email or contact your admin." },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("[/api/auth/login] Error:", error);
    return NextResponse.json(
      { error: "Authentication server error. Please try again." },
      { status: 500 }
    );
  }
}
