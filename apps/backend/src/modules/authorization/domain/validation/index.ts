export {
  validatePermissionCode,
  validatePermissionName,
  validatePermissionResourceAction,
  validateModule,
  validateRiskLevel,
  validatePermissionCatalogEntry,
  validatePermissionCatalog,
} from "./PermissionCatalogValidation.js";

export type {
  ValidationError as PermissionValidationError,
  PermissionCatalogEntry,
} from "./PermissionCatalogValidation.js";

export {
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
} from "./RoleValidation.js";

export type {
  ValidationError as RoleValidationError,
} from "./RoleValidation.js";

export {
  validateRolePermissionAssignment,
  validateDuplicateAssignment,
  validatePermissionsExist,
  canModifySystemRole,
  validateBulkAssignment,
} from "./RolePermissionValidation.js";

export type {
  ValidationError as RolePermissionValidationError,
} from "./RolePermissionValidation.js";

export {
  validateUserRoleAssignment,
  validateDuplicateUserRole,
  validateRestaurantContext,
  validateCrossTenantAssignment,
  validateSystemRoleAssignment,
  validateUserRoleUpdate,
  validateRoleRemoval,
} from "./UserRoleValidation.js";

export type {
  ValidationError as UserRoleValidationError,
} from "./UserRoleValidation.js";
