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
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
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
  phone?: string | null;
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
  description?: string | null;
  isDefault?: boolean;
  priority?: number;
  color?: string | null;
  icon?: string | null;
  status?: 'active' | 'inactive';
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

export type UserStatus = 'active' | 'inactive' | 'locked';

export function getUserStatus(user: AdminUser): UserStatus {
  if (!user.isActive) return 'inactive';
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) return 'locked';
  return 'active';
}

export const RISK_LEVEL_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export const USER_STATUS_CONFIG = {
  active: { label: 'Active', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  inactive: { label: 'Inactive', class: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  locked: { label: 'Locked', class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
} as const;
