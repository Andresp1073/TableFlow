'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminService from '@/services/admin';
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

export function usePlatformStats() {
  return useQuery<PlatformStats>({
    queryKey: ['admin', 'stats'],
    queryFn: adminService.getPlatformStats,
    staleTime: 30_000,
  });
}

export function useUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
} = {}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminService.listUsers(params),
    staleTime: 15_000,
  });
}

export function useUser(userId: string | undefined) {
  return useQuery<AdminUser>({
    queryKey: ['admin', 'users', userId],
    queryFn: () => adminService.getUser(userId!),
    enabled: !!userId,
    staleTime: 15_000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserDto) => adminService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useUpdateUser(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserDto) => adminService.updateUser(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminService.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminService.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useReplaceUserRoles(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleIds: string[]) => adminService.replaceUserRoles(userId!, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useResetUserPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      adminService.resetUserPassword(userId, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useRoles(restaurantId?: string) {
  return useQuery<AdminRole[]>({
    queryKey: ['admin', 'roles', restaurantId],
    queryFn: () => adminService.listRoles(restaurantId),
    staleTime: 30_000,
  });
}

export function useRole(roleId: string | undefined) {
  return useQuery<AdminRole>({
    queryKey: ['admin', 'roles', roleId],
    queryFn: () => adminService.getRole(roleId!),
    enabled: !!roleId,
    staleTime: 30_000,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleDto) => adminService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useUpdateRole(roleId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateRoleDto) => adminService.updateRole(roleId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) => adminService.deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useRolePermissions(roleId: string | undefined) {
  return useQuery<AdminPermission[]>({
    queryKey: ['admin', 'roles', roleId, 'permissions'],
    queryFn: () => adminService.getRolePermissions(roleId!),
    enabled: !!roleId,
    staleTime: 30_000,
  });
}

export function useReplaceRolePermissions(roleId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (permissionIds: string[]) =>
      adminService.replaceRolePermissions(roleId!, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles', roleId, 'permissions'] });
    },
  });
}

export function usePermissions(module?: string) {
  return useQuery<AdminPermission[]>({
    queryKey: ['admin', 'permissions', module],
    queryFn: () => adminService.listPermissions(module),
    staleTime: 60_000,
  });
}

export function usePermissionsGroups() {
  return useQuery<PermissionGroup[]>({
    queryKey: ['admin', 'permissions', 'groups'],
    queryFn: adminService.getPermissionsGroups,
    staleTime: 60_000,
  });
}
