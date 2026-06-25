export type IssueStatus = "Reported" | "Verified" | "Assigned" | "Site Visit Scheduled" | "Employee Reached Site" | "Inspection Started" | "Inspection Completed" | "Work Started" | "Work In Progress" | "In Progress" | "Work Completed" | "Admin Verification" | "Awaiting Citizen Review" | "Closed" | "Reopened" | "Rejected" | "Escalated" | "Open" | "Resolved";
export type UserRole = "super_admin" | "admin" | "employee" | "citizen";

export interface AppUser {
  email: string;
  name: string;
  role: UserRole;
  state?: string;
  city?: string;
  department?: string; // Newly added
  password?: string;   // Newly added
  isAvailable?: boolean; // Used for Admins/Employees (On/Off Duty)
  createdByAdmin?: string; // Email of admin who created this employee
}

export interface Issue {
  id: string;
  citizenEmail: string;
  imageBase64: string;
  description: string;
  location: string; // coordinates
  state?: string;
  city?: string;
  address?: string;
  timestamp: number;
  aiAnalysis: {
    category: string;
    severity: string;
    reasoningPoints: string[];
    department: string;
    trust: {
      status: string;
      checks: {
        hasGPS: boolean;
        isFresh: boolean;
        confidenceScore: number;
        spamScore?: number;
      }
    }
  };
  status: string; // broadened from IssueStatus
  priority?: string;
  assignedTo?: string; // email or name
  assignedDepartment?: string;
  eta?: number; // expected completion timestamp
  progressPercentage?: number;
  isDuplicateOf?: string;
  duplicateStatus?: "Pending" | "Confirmed" | "Overridden";
  timeline: {
    event: string;
    timestamp: number;
    metadata?: any;
  }[];
  progressUpdates?: {
    timestamp: number;
    note: string;
    author: string;
    progressPercentage?: number;
    attachments?: string[];
  }[];
  resolutionProof?: {
    imageBase64: string;
    notes: string;
    timeTaken?: string;
    materialUsed?: string;
  };
  citizenFeedback?: {
    rating: number;
    comment: string;
  };
  verificationScore?: number;
  cameraSource?: string;
  deviceInfo?: string;
  browserInfo?: string;
}

const ISSUES_STORAGE_KEY = "demo_issues_v2";
const USERS_STORAGE_KEY = "demo_users_v2";

// --- USERS API ---

export const getUsers = async (): Promise<AppUser[]> => {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/users");
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch users", err);
    return [];
  }
};

export const saveUser = async (user: AppUser) => {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
  } catch (err) {
    console.error("Failed to save user", err);
  }
};

export const deleteUser = async (email: string) => {
  if (typeof window === "undefined") return;
  try {
    await fetch(`/api/users?email=${encodeURIComponent(email)}`, {
      method: "DELETE"
    });
  } catch (err) {
    console.error("Failed to delete user", err);
  }
};

export const initializeSuperAdmin = async () => {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "superadmin@google.com",
        name: "Super Admin",
        role: "super_admin",
        password: "password123"
      })
    });
  } catch (err) {
    console.error("Failed to initialize super admin", err);
  }
};

// --- ISSUES API ---

export const getIssues = async (): Promise<Issue[]> => {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/issues");
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch issues", err);
    return [];
  }
};

// Auto assignment is now handled backend-side or via Admin dashboard

export const saveIssue = async (issue: Issue): Promise<Issue | null> => {
  if (typeof window === "undefined") return null;
  
  try {
    const res = await fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(issue)
    });
    return await res.json();
  } catch (err) {
    console.error("Failed to save issue", err);
    return null;
  }
};

export const updateIssueStatus = async (
  id: string, 
  newStatus: IssueStatus, 
  eventName?: string, 
  resolutionProof?: { imageBase64: string; notes: string },
  assignedTo?: string,
  actorName?: string,
  actorRole?: string
) => {
  if (typeof window === "undefined") return;
  try {
    await fetch(`/api/issues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus,
        eventName,
        resolutionProof,
        assignedTo,
        actorName,
        actorRole
      })
    });
  } catch (err) {
    console.error("Failed to update issue", err);
  }
};

export const addProgressUpdate = async (id: string, note: string, author: string, role?: string) => {
  if (typeof window === "undefined") return;
  try {
    // Re-route to PATCH endpoint for consistency with our new timeline system
    await fetch(`/api/issues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
         eventName: note,
         actorName: author,
         actorRole: role || "employee",
         status: "Work In Progress" // Add a comment implies work in progress mostly, but this might override.
      })
    });
  } catch (err) {
    console.error("Failed to add progress update", err);
  }
};

export const generateMockData = async () => {
  if (typeof window === "undefined") return;
  // Initialize Super Admin via API (Done in AuthContext mostly, but just in case)
  
  // Seed an Admin
  await saveUser({
    email: "cityadmin@communityhero.com",
    name: "Haryana City Admin",
    role: "admin",
    state: "Haryana",
    city: "Rohtak",
    department: "Water Department",
    password: "password123",
    isAvailable: true
  });

  // Seed an Employee under that Admin
  await saveUser({
    email: "worker@communityhero.com",
    name: "John the Worker",
    role: "employee",
    state: "Haryana",
    city: "Rohtak",
    department: "Water Department",
    password: "password123",
    isAvailable: true
  });
};
