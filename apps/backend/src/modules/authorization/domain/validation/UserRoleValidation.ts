import type { Role } from "../models/Role.js";
import type { UserRole } from "../models/UserRole.js";

const VALID_STATUSES = new Set(["active", "expired", "revoked"]);

export interface ValidationError {
  field: string;
  message: string;
}

export function validateUserRoleAssignment(
  role: Role | null,
  restaurantId: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!role) {
    errors.push({
      field: "roleId",
      message: "Role not found",
    });
    return errors;
  }

  if (role.status !== "active") {
    errors.push({
      field: "roleId",
      message: `Role '${role.code}' is ${role.status} and cannot be assigned`,
    });
  }

  if (role.restaurantId !== null && role.restaurantId !== restaurantId) {
    errors.push({
      field: "restaurantId",
      message: "Role does not belong to the specified restaurant",
    });
  }

  return errors;
}

export function validateDuplicateUserRole(
  existingAssignment: UserRole | null
): ValidationError | null {
  if (existingAssignment && existingAssignment.status === "active") {
    return {
      field: "assignment",
      message: "This role is already assigned to the user in this restaurant",
    };
  }
  return null;
}

export function validateRestaurantContext(
  userId: string,
  userOrganizationId: string | null,
  targetRestaurantId: string
): ValidationError | null {
  if (!userOrganizationId) {
    return {
      field: "userId",
      message: "User does not belong to any organization",
    };
  }

  if (userOrganizationId !== targetRestaurantId) {
    return {
      field: "restaurantId",
      message: "User does not belong to the specified restaurant",
    };
  }

  return null;
}

export function validateCrossTenantAssignment(
  roleRestaurantId: string | null,
  targetRestaurantId: string,
  assignedByRoleIsSystem: boolean
): ValidationError | null {
  if (roleRestaurantId === null && !assignedByRoleIsSystem) {
    return {
      field: "roleId",
      message: "System roles can only be assigned by platform administrators",
    };
  }

  if (roleRestaurantId !== null && roleRestaurantId !== targetRestaurantId) {
    return {
      field: "roleId",
      message: "Role belongs to a different restaurant",
    };
  }

  return null;
}

export function validateSystemRoleAssignment(
  role: Role,
  assignedByUserHasSystemRole: boolean
): ValidationError | null {
  if (role.isSystem && !assignedByUserHasSystemRole) {
    return {
      field: "roleId",
      message: "System roles require elevated permissions to assign",
    };
  }
  return null;
}

export function validateUserRoleUpdate(
  currentStatus: string,
  newStatus: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!VALID_STATUSES.has(newStatus)) {
    errors.push({
      field: "status",
      message: `Invalid status '${newStatus}'. Must be one of: active, expired, revoked`,
    });
  }

  if (currentStatus === "revoked") {
    errors.push({
      field: "status",
      message: "Cannot modify a revoked role assignment",
    });
  }

  if (currentStatus === "expired" && newStatus !== "active") {
    errors.push({
      field: "status",
      message: "Expired assignments can only be reactivated to active",
    });
  }

  return errors;
}

export function validateRoleRemoval(
  role: Role | null,
  existingAssignment: UserRole | null,
  isCurrentUserAdmin: boolean
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!existingAssignment) {
    errors.push({
      field: "assignment",
      message: "User does not have this role assigned",
    });
    return errors;
  }

  if (role && role.isSystem && !isCurrentUserAdmin) {
    errors.push({
      field: "roleId",
      message: "Cannot remove system roles without elevated permissions",
    });
  }

  return errors;
}
