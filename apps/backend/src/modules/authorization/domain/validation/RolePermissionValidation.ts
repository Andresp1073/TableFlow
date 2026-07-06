const SYSTEM_ROLE_CODES = new Set([
  "super-admin",
  "platform-admin",
  "support",
]);

export interface ValidationError {
  field: string;
  message: string;
}

export function validateRolePermissionAssignment(
  isSystemRole: boolean,
  isRoleDeletable: boolean,
  permissionCode?: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isSystemRole && !isRoleDeletable) {
    errors.push({
      field: "role",
      message: "Cannot modify permissions on a non-deletable system role",
    });
  }

  return errors;
}

export function validateDuplicateAssignment(
  existingAssignment: unknown
): ValidationError | null {
  if (existingAssignment) {
    return { field: "assignment", message: "This permission is already assigned to the role" };
  }

  return null;
}

export function validatePermissionsExist(
  permissionIds: string[],
  foundPermissionIds: string[]
): string[] {
  const notFound: string[] = [];
  for (const id of permissionIds) {
    if (!foundPermissionIds.includes(id)) {
      notFound.push(id);
    }
  }
  return notFound;
}

export function canModifySystemRole(isSystem: boolean): boolean {
  return !SYSTEM_ROLE_CODES.has(
    // We check isSystem flag — system roles with isDeletable=false can't be modified
    isSystem ? "super-admin" : ""
  );
}

export function validateBulkAssignment(
  roleId: string,
  permissionIds: string[],
  existingIds: string[]
): { valid: boolean; errors: ValidationError[]; newAssignments: string[] } {
  const errors: ValidationError[] = [];

  if (!roleId || roleId.length === 0) {
    errors.push({ field: "roleId", message: "Role ID is required" });
  }

  if (!permissionIds || permissionIds.length === 0) {
    errors.push({ field: "permissionIds", message: "At least one permission ID is required" });
  }

  const existingSet = new Set(existingIds);
  const newAssignments = permissionIds.filter((id) => !existingSet.has(id));

  return { valid: errors.length === 0, errors, newAssignments };
}
