import type { AuthorizationContext } from "../../domain/models/AuthorizationContext.js";
import type { PermissionEvaluator } from "../../domain/services/PermissionEvaluator.js";

export class PermissionEvaluatorImpl implements PermissionEvaluator {
  async hasPermission(
    context: AuthorizationContext,
    permissionCode: string
  ): Promise<boolean> {
    const set = new Set(context.permissions);
    return set.has(permissionCode);
  }

  async hasAnyPermission(
    context: AuthorizationContext,
    ...permissionCodes: string[]
  ): Promise<boolean> {
    const set = new Set(context.permissions);
    return permissionCodes.some((code) => set.has(code));
  }

  async hasAllPermissions(
    context: AuthorizationContext,
    ...permissionCodes: string[]
  ): Promise<boolean> {
    const set = new Set(context.permissions);
    return permissionCodes.every((code) => set.has(code));
  }

  async evaluateScope(
    context: AuthorizationContext,
    targetOrganizationId: string,
    targetBranchId?: string
  ): Promise<boolean> {
    const scope = context.scope;

    if (scope.type === "global") {
      return true;
    }

    if (scope.type === "organization") {
      if (scope.organizationId !== targetOrganizationId) {
        return false;
      }
      if (targetBranchId !== undefined) {
        return context.roles.some(
          (r) => r.branchId === null || r.branchId === targetBranchId
        );
      }
      return true;
    }

    if (scope.type === "branch") {
      return (
        scope.organizationId === targetOrganizationId &&
        (targetBranchId === undefined || scope.branchId === targetBranchId)
      );
    }

    return false;
  }
}
