import type { RolePermission } from "../models/RolePermission.js";

export interface RolePermissionRepository {
  findById(id: string): Promise<RolePermission | null>;
  findByRoleId(roleId: string): Promise<RolePermission[]>;
  findByPermissionId(permissionId: string): Promise<RolePermission[]>;
  findByRoleAndPermission(roleId: string, permissionId: string): Promise<RolePermission | null>;
  findAll(): Promise<RolePermission[]>;
  create(roleId: string, permissionId: string): Promise<RolePermission>;
  delete(id: string): Promise<void>;
  deleteByRoleAndPermission(roleId: string, permissionId: string): Promise<void>;
  deleteByRoleId(roleId: string): Promise<void>;
}
