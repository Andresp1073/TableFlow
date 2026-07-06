import type { UserRole, UserRoleStatus } from "../models/UserRole.js";

export interface UserRoleRepository {
  findById(id: string): Promise<UserRole | null>;
  findByUserAndRole(userId: string, roleId: string, restaurantId: string): Promise<UserRole | null>;
  findByUser(userId: string): Promise<UserRole[]>;
  findByRole(roleId: string): Promise<UserRole[]>;
  findByRestaurant(restaurantId: string): Promise<UserRole[]>;
  findByUserAndRestaurant(userId: string, restaurantId: string): Promise<UserRole[]>;
  findByRestaurantAndRole(restaurantId: string, roleId: string): Promise<UserRole[]>;
  findUsersByRole(roleId: string): Promise<UserRole[]>;
  findActiveByUser(userId: string): Promise<UserRole[]>;
  findExpired(): Promise<UserRole[]>;
  create(data: {
    userId: string;
    roleId: string;
    restaurantId: string;
    branchId?: string | null;
    assignedBy: string;
    expiresAt?: Date | null;
  }): Promise<UserRole>;
  updateStatus(id: string, status: UserRoleStatus): Promise<UserRole>;
  updateExpiresAt(id: string, expiresAt: Date | null): Promise<UserRole>;
  delete(id: string): Promise<void>;
  deleteByUserAndRole(userId: string, roleId: string, restaurantId: string): Promise<void>;
}
