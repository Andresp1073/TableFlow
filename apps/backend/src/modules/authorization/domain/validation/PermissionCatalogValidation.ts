const PERMISSION_CODE_REGEX = /^[a-z]+\.[a-zA-Z]+$/;
const KNOWN_MODULES = new Set([
  "auth", "users", "roles", "restaurants", "branches",
  "tables", "reservations", "customers", "notifications",
  "reports", "dashboard", "settings", "audit",
  "organizations", "system",
]);

const RESERVED_PREFIXES = ["_", "internal."];

export interface ValidationError {
  field: string;
  message: string;
}

export interface PermissionCatalogEntry {
  code: string;
  name: string;
  description: string;
  module: string;
  resource: string;
  action: string;
  riskLevel: string;
}

export function validatePermissionCode(code: string): ValidationError | null {
  if (!code || code.length === 0) {
    return { field: "code", message: "Permission code is required" };
  }

  if (code.length > 150) {
    return { field: "code", message: "Permission code must not exceed 150 characters" };
  }

  if (!PERMISSION_CODE_REGEX.test(code)) {
    return { field: "code", message: "Permission code must follow dot notation (e.g. 'users.create')" };
  }

  for (const prefix of RESERVED_PREFIXES) {
    if (code.startsWith(prefix)) {
      return { field: "code", message: `Permission code must not start with reserved prefix '${prefix}'` };
    }
  }

  return null;
}

export function validatePermissionName(name: string): ValidationError | null {
  if (!name || name.length === 0) {
    return { field: "name", message: "Permission display name is required" };
  }

  if (name.length > 200) {
    return { field: "name", message: "Permission display name must not exceed 200 characters" };
  }

  return null;
}

export function validatePermissionResourceAction(resource: string, action: string): ValidationError | null {
  if (!resource || resource.length === 0) {
    return { field: "resource", message: "Resource is required" };
  }

  if (!action || action.length === 0) {
    return { field: "action", message: "Action is required" };
  }

  return null;
}

export function validateModule(module: string): ValidationError | null {
  if (!module || module.length === 0) {
    return { field: "module", message: "Module is required" };
  }

  if (!KNOWN_MODULES.has(module)) {
    return { field: "module", message: `Module must be one of: ${Array.from(KNOWN_MODULES).sort().join(", ")}` };
  }

  return null;
}

export function validateRiskLevel(riskLevel: string): ValidationError | null {
  const VALID_RISK_LEVELS = ["low", "medium", "high", "critical"];
  if (!VALID_RISK_LEVELS.includes(riskLevel)) {
    return { field: "riskLevel", message: "Risk level must be one of: low, medium, high, critical" };
  }

  return null;
}

export function validatePermissionCatalogEntry(entry: PermissionCatalogEntry): ValidationError[] {
  const errors: ValidationError[] = [];

  const codeError = validatePermissionCode(entry.code);
  if (codeError) errors.push(codeError);

  const nameError = validatePermissionName(entry.name);
  if (nameError) errors.push(nameError);

  const resourceActionError = validatePermissionResourceAction(entry.resource, entry.action);
  if (resourceActionError) errors.push(resourceActionError);

  const moduleError = validateModule(entry.module);
  if (moduleError) errors.push(moduleError);

  const riskLevelError = validateRiskLevel(entry.riskLevel);
  if (riskLevelError) errors.push(riskLevelError);

  if (entry.code && entry.resource && entry.action) {
    const expectedCode = `${entry.resource}.${entry.action}`;
    if (entry.code !== expectedCode) {
      errors.push({
        field: "code",
        message: `Permission code '${entry.code}' does not match resource.action format '${expectedCode}'`,
      });
    }
  }

  return errors;
}

export function validatePermissionCatalog(entries: PermissionCatalogEntry[]): ValidationError[][] {
  return entries.map(validatePermissionCatalogEntry);
}
