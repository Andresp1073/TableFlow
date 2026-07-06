export type UserRoleStatus = "active" | "expired" | "revoked";

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  restaurantId: string;
  branchId: string | null;
  assignedBy: string;
  assignedAt: Date;
  expiresAt: Date | null;
  status: UserRoleStatus;
  createdAt: Date;
  updatedAt: Date;
}
