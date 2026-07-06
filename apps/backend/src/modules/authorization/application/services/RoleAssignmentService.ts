import type { Role } from "../../domain/models/Role.js";
import type { UserRole, UserRoleStatus } from "../../domain/models/UserRole.js";

export interface UserWithRole {
  userId: string;
  role: Role;
  branchId: string | null;
}

export interface RoleAssignmentResult {
  assignment: UserRole;
}

export interface ReplaceRolesResult {
  removed: number;
  assigned: number;
  assignments: UserRole[];
}

export interface RestaurantUser {
  userId: string;
  assignments: UserRole[];
}

/**
 * Manages the lifecycle of role-to-user assignments.
 * Enforces invariants such as preventing duplicate assignments,
 * restricting system role mutations, and validating cross-tenant boundaries.
 */
export interface RoleAssignmentService {
  assignRole(
    userId: string,
    roleId: string,
    restaurantId: string,
    assignedBy: string,
    options?: {
      branchId?: string | null;
      expiresAt?: Date | null;
    }
  ): Promise<RoleAssignmentResult>;

  removeRole(
    userId: string,
    roleId: string,
    restaurantId: string,
    performedBy: string
  ): Promise<void>;

  replaceUserRoles(
    userId: string,
    restaurantId: string,
    roleIds: string[],
    assignedBy: string,
    options?: {
      branchId?: string | null;
      expiresAt?: Date | null;
    }
  ): Promise<ReplaceRolesResult>;

  getUserRoles(userId: string, restaurantId?: string): Promise<UserRole[]>;

  getUsersInRole(roleId: string, restaurantId?: string): Promise<UserRole[]>;

  getRestaurantUsers(restaurantId: string): Promise<RestaurantUser[]>;

  updateAssignmentStatus(
    assignmentId: string,
    status: UserRoleStatus,
    performedBy: string
  ): Promise<UserRole>;

  updateAssignmentExpiry(
    assignmentId: string,
    expiresAt: Date | null,
    performedBy: string
  ): Promise<UserRole>;

  validateAssignment(
    userId: string,
    roleId: string,
    restaurantId: string
  ): Promise<{ valid: boolean; errors: string[] }>;
}
