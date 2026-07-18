import { get, post, patch, put, del } from './api';
import type {
  AdminUser,
  AdminRole,
  AdminPermission,
  PermissionGroup,
  PlatformStats,
  CreateUserDto,
  UpdateUserDto,
  CreateRoleDto,
  UpdateRoleDto,
} from '@/lib/admin-types';

const ADMIN_BASE = '/admin';

export async function getPlatformStats(): Promise<PlatformStats> {
  const response = await get<PlatformStats>(`${ADMIN_BASE}/stats`);
  return response.data;
}

export async function listUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
} = {}): Promise<{ data: AdminUser[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.search) query.set('search', params.search);
  if (params.role) query.set('role', params.role);
  if (params.status) query.set('status', params.status);
  const qs = query.toString();
  const response = await get<AdminUser[]>(`${ADMIN_BASE}/users${qs ? `?${qs}` : ''}`);
  return { data: response.data, meta: response.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 } };
}

export async function getUser(userId: string): Promise<AdminUser> {
  const response = await get<AdminUser>(`${ADMIN_BASE}/users/${userId}`);
  return response.data;
}

export async function createUser(data: CreateUserDto): Promise<AdminUser> {
  const response = await post<AdminUser>(`${ADMIN_BASE}/users`, data);
  return response.data;
}

export async function updateUser(userId: string, data: UpdateUserDto): Promise<AdminUser> {
  const response = await patch<AdminUser>(`${ADMIN_BASE}/users/${userId}`, data);
  return response.data;
}

export async function deactivateUser(userId: string): Promise<void> {
  await patch<null>(`${ADMIN_BASE}/users/${userId}/deactivate`);
}

export async function activateUser(userId: string): Promise<void> {
  await patch<null>(`${ADMIN_BASE}/users/${userId}/activate`);
}

export async function replaceUserRoles(userId: string, roleIds: string[]): Promise<AdminUser> {
  const response = await patch<AdminUser>(`${ADMIN_BASE}/users/${userId}/roles`, { roleIds });
  return response.data;
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  await post<null>(`${ADMIN_BASE}/users/${userId}/reset-password`, { newPassword });
}

export async function listRoles(restaurantId?: string): Promise<AdminRole[]> {
  const query = restaurantId ? `?restaurantId=${restaurantId}` : '';
  const response = await get<AdminRole[]>(`${ADMIN_BASE}/roles${query}`);
  return response.data;
}

export async function getRole(roleId: string): Promise<AdminRole> {
  const response = await get<AdminRole>(`${ADMIN_BASE}/roles/${roleId}`);
  return response.data;
}

export async function createRole(data: CreateRoleDto): Promise<AdminRole> {
  const response = await post<AdminRole>(`${ADMIN_BASE}/roles`, data);
  return response.data;
}

export async function updateRole(roleId: string, data: UpdateRoleDto): Promise<AdminRole> {
  const response = await patch<AdminRole>(`${ADMIN_BASE}/roles/${roleId}`, data);
  return response.data;
}

export async function deleteRole(roleId: string): Promise<void> {
  await del<null>(`${ADMIN_BASE}/roles/${roleId}`);
}

export async function getRolePermissions(roleId: string): Promise<AdminPermission[]> {
  const response = await get<AdminPermission[]>(`${ADMIN_BASE}/roles/${roleId}/permissions`);
  return response.data;
}

export async function replaceRolePermissions(roleId: string, permissionIds: string[]): Promise<AdminPermission[]> {
  const response = await put<AdminPermission[]>(`${ADMIN_BASE}/roles/${roleId}/permissions`, { permissionIds });
  return response.data;
}

export async function listPermissions(module?: string): Promise<AdminPermission[]> {
  const query = module ? `?module=${module}` : '';
  const response = await get<AdminPermission[]>(`${ADMIN_BASE}/permissions${query}`);
  return response.data;
}

export async function getPermissionsGroups(): Promise<PermissionGroup[]> {
  const response = await get<PermissionGroup[]>(`${ADMIN_BASE}/permissions/groups`);
  return response.data;
}
