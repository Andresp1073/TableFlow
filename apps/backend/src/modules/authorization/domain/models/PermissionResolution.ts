export interface PermissionResolutionContext {
  userId: string;
  restaurantId: string;
  organizationId: string;
  requestId?: string;
}

export interface PermissionResolutionResult {
  userId: string;
  restaurantId: string;
  permissions: ReadonlySet<string>;
  permissionCodes: readonly string[];
  roleIds: readonly string[];
  roleCodes: readonly string[];
  resolvedAt: Date;
}
