import { z } from 'zod';

export const listUsersSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    role: z.string().optional(),
    status: z.enum(['active', 'inactive', 'locked', 'all']).optional(),
  }),
};

export const userIdParamSchema = {
  params: z.object({
    userId: z.string().uuid(),
  }),
};

export const roleIdParamSchema = {
  params: z.object({
    roleId: z.string().uuid(),
  }),
};

export const createUserSchema = {
  body: z.object({
    email: z.string().email().max(255).transform((v) => v.toLowerCase().trim()),
    password: z.string().min(8).max(128),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    phone: z.string().max(20).optional(),
    roleIds: z.array(z.string().uuid()).optional(),
  }),
};

export const updateUserSchema = {
  body: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    email: z.string().email().max(255).transform((v) => v.toLowerCase().trim()).optional(),
    phone: z.string().max(20).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
};

export const replaceUserRolesSchema = {
  body: z.object({
    roleIds: z.array(z.string().uuid()),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    newPassword: z.string().min(8).max(128),
  }),
};

export const listRolesSchema = {
  query: z.object({
    restaurantId: z.string().uuid().optional(),
  }),
};

export const createRoleSchema = {
  body: z.object({
    code: z.string().min(1).max(50),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    restaurantId: z.string().uuid().optional(),
    isDefault: z.boolean().optional(),
    priority: z.number().int().min(0).max(9999).optional(),
    color: z.string().max(20).optional(),
    icon: z.string().max(50).optional(),
  }),
};

export const updateRoleSchema = {
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    isDefault: z.boolean().optional(),
    priority: z.number().int().min(0).max(9999).optional(),
    color: z.string().max(20).optional().nullable(),
    icon: z.string().max(50).optional().nullable(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
};

export const replaceRolePermissionsSchema = {
  body: z.object({
    permissionIds: z.array(z.string().uuid()),
  }),
};

export const listPermissionsSchema = {
  query: z.object({
    module: z.string().optional(),
  }),
};
