"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function grantAdminRole(email: string) {
  try {
    // 1. Authenticate caller
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const client = await clerkClient();

    // 2. Authorize caller (ensure they are an admin)
    const caller = await client.users.getUser(userId);
    if (caller.publicMetadata?.role !== "admin") {
      return { success: false, error: "Forbidden: You do not have permission to grant admin roles." };
    }

    // 3. Find the target user by email
    const users = await client.users.getUserList({ emailAddress: [email] });
    const targetUser = users.data[0];

    if (!targetUser) {
      return { success: false, error: "User not found. They must sign up as a citizen first." };
    }

    if (targetUser.publicMetadata?.role === "admin") {
       return { success: false, error: "User is already an Admin!" };
    }

    // 4. Update the user's public metadata
    await client.users.updateUserMetadata(targetUser.id, {
      publicMetadata: {
        role: "admin",
      },
    });

    revalidatePath("/admin");
    return { success: true, message: `Successfully granted Admin privileges to ${email}` };

  } catch (error: any) {
    console.error("Error granting admin role:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}
