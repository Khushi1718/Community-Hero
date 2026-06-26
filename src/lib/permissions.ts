import AuditLog from "@/models/AuditLog";

export type Role = "citizen" | "volunteer_org" | "employee" | "admin" | "super_admin";

export const PERMISSIONS = {
  CAN_APPROVE_ORG: ["admin", "super_admin"],
  CAN_CREATE_DRIVE: ["admin", "super_admin"],
  CAN_EDIT_DRIVE: ["admin", "super_admin", "volunteer_org"],
  CAN_JOIN_DRIVE: ["citizen"],
  CAN_DELETE_STORY: ["super_admin"],
  CAN_VERIFY_COMPLETION: ["admin", "super_admin"],
  CAN_SUSPEND_ORG: ["admin", "super_admin"],
  CAN_VIEW_AUDIT_LOGS: ["admin", "super_admin"],
  CAN_MANAGE_CHALLENGES: ["admin", "super_admin"],
};

export async function checkPermission(userRole: string, requiredRoles: string[]) {
  if (!requiredRoles.includes(userRole)) {
    throw new Error(`Permission Denied. Required roles: ${requiredRoles.join(", ")}`);
  }
}

export async function logAudit(
  actionType: string,
  actorEmail: string,
  actorRole: string,
  targetEntityId: string | null,
  targetEntityType: string | null,
  metadata: any,
  status: "SUCCESS" | "FAILURE" = "SUCCESS"
) {
  try {
    await AuditLog.create({
      actionType,
      actorEmail,
      actorRole,
      targetEntityId,
      targetEntityType,
      metadata,
      status,
    });
  } catch (err) {
    console.error("Failed to write audit log", err);
  }
}
