import type { AuthorizationContext } from "../models/AuthorizationContext.js";

/**
 * Evaluates whether an AuthorizationContext grants specific permissions.
 * Implementations perform DB lookups or cache checks against role-permission mappings.
 */
export interface PermissionEvaluator {
  hasPermission(context: AuthorizationContext, permissionName: string): Promise<boolean>;
  hasAnyPermission(context: AuthorizationContext, ...permissionNames: string[]): Promise<boolean>;
  hasAllPermissions(context: AuthorizationContext, ...permissionNames: string[]): Promise<boolean>;

  /**
   * Validates that the user's scope covers the target organization/branch.
   * A global-scoped user has access everywhere.
   * An organization-scoped user has access only within that organization.
   * A branch-scoped user has access only within that specific branch.
   */
  evaluateScope(
    context: AuthorizationContext,
    targetOrganizationId: string,
    targetBranchId?: string
  ): Promise<boolean>;
}
