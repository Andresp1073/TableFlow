// ── Domain Models ──────────────────────────────────────────────────────────
export type {
  Role,
  Permission,
  UserRole,
  UserRoleStatus,
  RolePermission,
  AuthorizationContext,
  AuthorizationScope,
  UserRoleInfo,
  PermissionResolutionContext,
  PermissionResolutionResult,
  ResourceContext,
  ResourceType,
} from "./domain/models/index.js";

// ── Domain Validation ───────────────────────────────────────────────────────
export {
  validatePermissionCode,
  validatePermissionName,
  validatePermissionResourceAction,
  validateModule,
  validateRiskLevel,
  validatePermissionCatalogEntry,
  validatePermissionCatalog,
  validateRoleCode,
  validateRoleName,
  validateRolePriority,
  validateRoleColor,
  validateRoleIcon,
  validateRoleStatus,
  validateSystemRoleDeletion,
  validateDefaultRoleDuplicate,
  validateRestaurantRoleDuplicate,
  validateRole,
  validateRolePermissionAssignment,
  validateDuplicateAssignment,
  validatePermissionsExist,
  canModifySystemRole,
  validateBulkAssignment,
  validateUserRoleAssignment,
  validateDuplicateUserRole,
  validateRestaurantContext,
  validateCrossTenantAssignment,
  validateSystemRoleAssignment,
  validateUserRoleUpdate,
  validateRoleRemoval,
} from "./domain/validation/index.js";
export type {
  PermissionValidationError,
  PermissionCatalogEntry,
  RoleValidationError,
  RolePermissionValidationError,
  UserRoleValidationError,
} from "./domain/validation/index.js";

// ── Repository Interfaces ──────────────────────────────────────────────────
export type {
  RoleRepository,
  PermissionRepository,
  RolePermissionRepository,
  UserRoleRepository,
} from "./domain/repositories/index.js";

// ── Domain Services ────────────────────────────────────────────────────────
export type { PermissionEvaluator, PermissionResolver, PermissionResolutionService, AuthorizationPolicy, PolicyEvaluation, PolicyEvaluator, ResourceAuthorizationService } from "./domain/services/index.js";

// ── Application Services ───────────────────────────────────────────────────
export type {
  AuthorizationService,
  RoleAssignmentService,
  UserWithRole,
  RoleAssignmentResult,
  ReplaceRolesResult,
  RestaurantUser,
  RolePermissionService,
  AssignPermissionsResult,
} from "./application/services/index.js";
export { AuthorizationServiceImpl, PermissionEvaluatorImpl, RoleAssignmentPolicy, PlatformAdminPolicy, SameRestaurantPolicy, OwnerPolicy, AssignedEmployeePolicy, PolicyEvaluatorImpl, ResourceAuthorizationServiceImpl } from "./application/services/index.js";

// ── Infrastructure ──────────────────────────────────────────────────────────
export {
  RolePermissionRepositoryImpl,
  UserRoleRepositoryImpl,
  RolePermissionServiceImpl,
  RoleAssignmentServiceImpl,
  PermissionResolutionServiceImpl,
} from "./infrastructure/index.js";

// ── Middleware ──────────────────────────────────────────────────────────────
export {
  enrichContext,
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireRestaurantAccess,
} from "./middleware/index.js";

// ── Errors ─────────────────────────────────────────────────────────────────
export {
  RoleNotFoundError,
  PermissionDeniedError,
  PermissionNotFoundError,
  InvalidRoleAssignmentError,
  UnauthorizedRestaurantAccessError,
  DuplicateAssignmentError,
  UserNotFoundError,
  AssignmentNotFoundError,
  ResourceForbiddenError,
} from "./errors/index.js";
