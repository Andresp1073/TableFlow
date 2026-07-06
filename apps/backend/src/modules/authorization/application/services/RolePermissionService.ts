import type { RolePermission } from "../../domain/models/RolePermission.js";
import type { RolePermissionRepository } from "../../domain/repositories/RolePermissionRepository.js";

export interface AssignPermissionsResult {
  assigned: number;
  skipped: number;
  errors: string[];
}

export interface RolePermissionService {
  assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission>;
  assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<AssignPermissionsResult>;
  removePermissionFromRole(roleId: string, permissionId: string): Promise<void>;
  removePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<number>;
  replaceRolePermissions(roleId: string, permissionIds: string[]): Promise<RolePermission[]>;
  getRolePermissions(roleId: string): Promise<RolePermission[]>;
  getPermissionRoles(permissionId: string): Promise<RolePermission[]>;
  hasPermission(roleId: string, permissionId: string): Promise<boolean>;
}
