import type { Permission } from "../models/Permission.js";

export interface PermissionRepository {
  findById(id: string): Promise<Permission | null>;
  findByCode(code: string): Promise<Permission | null>;
  findAll(): Promise<Permission[]>;
  findByModule(module: string): Promise<Permission[]>;
  findByResource(resource: string): Promise<Permission[]>;
  findPermissionsByRole(roleId: string): Promise<Permission[]>;
  findPermissionsByUser(userId: string): Promise<Permission[]>;
}
