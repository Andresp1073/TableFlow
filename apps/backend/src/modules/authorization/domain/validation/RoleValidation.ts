const ROLE_CODE_REGEX = /^[a-z][a-z0-9-]*$/;

const SYSTEM_ROLE_CODES = new Set([
  "super-admin",
  "platform-admin",
  "support",
]);

const VALID_STATUSES = ["active", "inactive", "archived"];

export interface ValidationError {
  field: string;
  message: string;
}

export function validateRoleCode(code: string): ValidationError | null {
  if (!code || code.length === 0) {
    return { field: "code", message: "Role code is required" };
  }

  if (code.length > 100) {
    return { field: "code", message: "Role code must not exceed 100 characters" };
  }

  if (!ROLE_CODE_REGEX.test(code)) {
    return {
      field: "code",
      message:
        "Role code must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens",
    };
  }

  return null;
}

export function validateRoleName(name: string): ValidationError | null {
  if (!name || name.length === 0) {
    return { field: "name", message: "Role name is required" };
  }

  if (name.length > 100) {
    return { field: "name", message: "Role name must not exceed 100 characters" };
  }

  return null;
}

export function validateRolePriority(priority: number): ValidationError | null {
  if (!Number.isInteger(priority)) {
    return { field: "priority", message: "Priority must be an integer" };
  }

  if (priority < 0 || priority > 10000) {
    return { field: "priority", message: "Priority must be between 0 and 10000" };
  }

  return null;
}

export function validateRoleColor(color: string | null): ValidationError | null {
  if (color === null) return null;

  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return { field: "color", message: "Color must be a valid hex color (e.g. #DC2626)" };
  }

  return null;
}

export function validateRoleIcon(icon: string | null): ValidationError | null {
  if (icon === null) return null;

  if (!/^[a-z][a-z0-9-]*$/.test(icon)) {
    return { field: "icon", message: "Icon must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens" };
  }

  return null;
}

export function validateRoleStatus(status: string): ValidationError | null {
  if (!VALID_STATUSES.includes(status)) {
    return { field: "status", message: `Status must be one of: ${VALID_STATUSES.join(", ")}` };
  }

  return null;
}

export function validateSystemRoleDeletion(roleCode: string): ValidationError | null {
  if (SYSTEM_ROLE_CODES.has(roleCode)) {
    return { field: "code", message: `System role '${roleCode}' cannot be deleted` };
  }

  return null;
}

export function validateDefaultRoleDuplicate(
  code: string,
  isDefault: boolean,
  existingDefaultRoleCodes: Set<string>
): ValidationError | null {
  if (isDefault && existingDefaultRoleCodes.has(code)) {
    return { field: "code", message: `A default role with code '${code}' already exists` };
  }

  return null;
}

export function validateRestaurantRoleDuplicate(
  code: string,
  restaurantId: string,
  existingCodesInRestaurant: Set<string>
): ValidationError | null {
  if (existingCodesInRestaurant.has(code)) {
    return {
      field: "code",
      message: `Role with code '${code}' already exists in this restaurant`,
    };
  }

  return null;
}

export function validateRole(
  role: {
    code: string;
    name: string;
    priority: number;
    color: string | null;
    icon: string | null;
    status: string;
  }
): ValidationError[] {
  const errors: ValidationError[] = [];

  const codeError = validateRoleCode(role.code);
  if (codeError) errors.push(codeError);

  const nameError = validateRoleName(role.name);
  if (nameError) errors.push(nameError);

  const priorityError = validateRolePriority(role.priority);
  if (priorityError) errors.push(priorityError);

  const colorError = validateRoleColor(role.color);
  if (colorError) errors.push(colorError);

  const iconError = validateRoleIcon(role.icon);
  if (iconError) errors.push(iconError);

  const statusError = validateRoleStatus(role.status);
  if (statusError) errors.push(statusError);

  return errors;
}
