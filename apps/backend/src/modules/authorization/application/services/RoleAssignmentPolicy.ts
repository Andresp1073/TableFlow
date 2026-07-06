import type { Role } from "../../domain/models/Role.js";

/**
 * Encapsulates authorization policy decisions for role assignment operations.
 * Determines who can assign, remove, or modify role assignments based on role types.
 */
export class RoleAssignmentPolicy {
  private readonly SYSTEM_ROLE_CODES = new Set([
    "super-admin",
    "platform-admin",
    "support",
  ]);

  canAssignRole(
    targetRole: Role,
    currentUserHasSystemRole: boolean,
    currentUserRoleCodes: string[]
  ): { allowed: boolean; reason?: string } {
    if (targetRole.isSystem && !currentUserHasSystemRole) {
      return {
        allowed: false,
        reason: "System roles require platform-level permissions to assign",
      };
    }

    if (
      targetRole.restaurantId !== null &&
      !currentUserHasSystemRole &&
      !currentUserRoleCodes.some((code) => code === "restaurant-owner" || code === "restaurant-manager")
    ) {
      return {
        allowed: false,
        reason: "Insufficient permissions to assign restaurant roles",
      };
    }

    return { allowed: true };
  }

  canRemoveRole(
    targetRole: Role,
    currentUserHasSystemRole: boolean,
    currentUserRoleCodes: string[]
  ): { allowed: boolean; reason?: string } {
    if (targetRole.isSystem && !currentUserHasSystemRole) {
      return {
        allowed: false,
        reason: "System roles require platform-level permissions to remove",
      };
    }

    if (
      targetRole.restaurantId !== null &&
      !currentUserHasSystemRole &&
      !currentUserRoleCodes.some((code) => code === "restaurant-owner" || code === "restaurant-manager")
    ) {
      return {
        allowed: false,
        reason: "Insufficient permissions to remove restaurant roles",
      };
    }

    return { allowed: true };
  }

  canModifySystemRoles(currentUserRoleCodes: string[]): boolean {
    return currentUserRoleCodes.some((code) =>
      this.SYSTEM_ROLE_CODES.has(code)
    );
  }

  isTenantAdmin(currentUserRoleCodes: string[]): boolean {
    return currentUserRoleCodes.some(
      (code) =>
        code === "restaurant-owner" ||
        code === "restaurant-manager"
    );
  }
}
