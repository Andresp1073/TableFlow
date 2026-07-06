import type { AuthorizationContext, UserRoleInfo } from "../../domain/models/AuthorizationContext.js";

/**
 * Core authorization service.
 * Orchestrates permission evaluation, scope enforcement, and context creation.
 * Implementations coordinate between PermissionEvaluator and PermissionResolver.
 */
export interface AuthorizationService {
  /**
   * Verifies that the given context includes the required permission.
   * Throws PermissionDeniedError if the permission is not granted.
   */
  authorize(context: AuthorizationContext, requiredPermission: string): Promise<void>;

  /**
   * Verifies both the required permission AND scope access to the target resource.
   * Throws PermissionDeniedError or UnauthorizedRestaurantAccessError on failure.
   */
  authorizeScoped(
    context: AuthorizationContext,
    requiredPermission: string,
    targetOrganizationId: string,
    targetBranchId?: string
  ): Promise<void>;

  /**
   * Builds an AuthorizationContext for a user by resolving roles, permissions,
   * and scope from the database.
   */
  createContext(userId: string, organizationId: string, metadata?: { ip?: string; userAgent?: string; requestId?: string }): Promise<AuthorizationContext>;

  /**
   * Returns all permission names granted to the given context.
   */
  getPermissions(context: AuthorizationContext): Promise<string[]>;
}
