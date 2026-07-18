export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  isVerified: boolean;
  failedLoginAttempts: number;
  lastFailedLoginAt: string | null;
  lockedAt: string | null;
  lockedUntil: string | null;
  lockReason: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  userRoles: AdminUserRoleAssignment[];
}

export interface AdminUserRoleAssignment {
  id: string;
  roleId: string;
  restaurantId: string;
  branchId: string | null;
  status: string;
  expiresAt: string | null;
  assignedAt: string;
  role: AdminRoleSummary;
}

export interface AdminRoleSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isDefault: boolean;
  priority: number;
  color: string | null;
  status: string;
}

export interface AdminRole {
  id: string;
  code: string;
  name: string;
  description: string | null;
  restaurantId: string | null;
  isSystem: boolean;
  isDefault: boolean;
  priority: number;
  color: string | null;
  icon: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    userRoles: number;
    rolePermissions: number;
  };
}

export interface AdminPermission {
  id: string;
  code: string;
  name: string;
  description: string;
  module: string;
  resource: string;
  action: string;
  riskLevel: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionGroup {
  module: string;
  permissions: AdminPermission[];
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleIds?: string[];
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface CreateRoleDto {
  code: string;
  name: string;
  description?: string;
  restaurantId?: string;
  isDefault?: boolean;
  priority?: number;
  color?: string;
  icon?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  isDefault?: boolean;
  priority?: number;
  color?: string;
  icon?: string;
  status?: string;
}

export interface ReplaceUserRolesDto {
  roleIds: string[];
}

export interface ReplaceRolePermissionsDto {
  permissionIds: string[];
}

export interface ResetPasswordDto {
  newPassword: string;
}

export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  unverifiedUsers: number;
  totalRestaurants: number;
  activeRestaurants: number;
  totalRoles: number;
  totalPermissions: number;
  recentLogins: number;
  activeSessions: number;
}
