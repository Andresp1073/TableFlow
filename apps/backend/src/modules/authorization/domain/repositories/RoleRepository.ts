import type { Role } from "../models/Role.js";

export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  findByCode(code: string): Promise<Role | null>;
  findByCodeAndRestaurant(code: string, restaurantId: string): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  findSystemRoles(): Promise<Role[]>;
  findDefaultRoles(): Promise<Role[]>;
  findRolesByRestaurant(restaurantId: string): Promise<Role[]>;
  findRolesByUser(userId: string): Promise<{ role: Role; branchId: string | null }[]>;
}
