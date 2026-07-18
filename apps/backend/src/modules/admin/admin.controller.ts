import type { Response } from 'express';
import { AdminRepository } from './admin.repository.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent, buildPaginationMeta } from '../../utils/response.js';
import type { AuthenticatedRequest } from '../../middlewares/auth.js';
import { ForbiddenError } from '../../errors/ForbiddenError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';

const adminRepo = new AdminRepository();

export const getStats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const stats = await adminRepo.getPlatformStats();
    sendSuccess(res, stats);
  },
);

export const listUsers = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const queryParams = req.query as Record<string, string | undefined>;
    const page = queryParams['page'];
    const limit = queryParams['limit'];
    const search = queryParams['search'];
    const role = queryParams['role'];
    const status = queryParams['status'];

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const effectiveStatus = status === 'all' ? undefined : status;

    const [users, total] = await Promise.all([
      adminRepo.findUsers({
        skip,
        take: limitNum,
        search,
        role,
        status: effectiveStatus,
        organizationId: req.organizationId,
      }),
      adminRepo.countUsers({
        search,
        role,
        status: effectiveStatus,
        organizationId: req.organizationId,
      }),
    ]);

    sendPaginated(res, users, buildPaginationMeta(total, pageNum, limitNum));
  },
);

export const getUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const params = req.params as Record<string, string>;
    const user = await adminRepo.findUserById(params['userId']!);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    sendSuccess(res, user);
  },
);

export const createUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { email, password, firstName, lastName, phone, roleIds } = req.body as Record<string, unknown>;

    const existing = await adminRepo.findUsers({
      skip: 0,
      take: 1,
      search: email as string,
    });

    const emailStr = (email as string).toLowerCase().trim();
    if (existing.length > 0 && existing.some((u) => u.email === emailStr)) {
      throw new ConflictError('A user with this email already exists');
    }

    const user = await adminRepo.createUser({
      email: emailStr,
      password: password as string,
      firstName: firstName as string,
      lastName: lastName as string,
      phone: phone as string | undefined,
      organizationId: req.organizationId!,
    });

    if (roleIds && (roleIds as string[]).length > 0) {
      await adminRepo.replaceUserRoles(
        user.id,
        roleIds as string[],
        '00000000-0000-0000-0000-000000000000',
        req.userId!,
      );
    }

    const created = await adminRepo.findUserById(user.id);
    sendCreated(res, created, 'User created successfully');
  },
);

export const updateUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const params = req.params as Record<string, string>;
    const existing = await adminRepo.findUserById(params['userId']!);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const user = await adminRepo.updateUser(params['userId']!, req.body);
    sendSuccess(res, user, undefined, 'User updated successfully');
  },
);

export const deactivateUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const params = req.params as Record<string, string>;
    const existing = await adminRepo.findUserById(params['userId']!);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    await adminRepo.deactivateUser(params['userId']!);
    sendSuccess(res, null, undefined, 'User deactivated successfully');
  },
);

export const activateUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const params = req.params as Record<string, string>;
    const existing = await adminRepo.findUserById(params['userId']!);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    await adminRepo.activateUser(params['userId']!);
    sendSuccess(res, null, undefined, 'User activated successfully');
  },
);

export const replaceUserRoles = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const params = req.params as Record<string, string>;
    const existing = await adminRepo.findUserById(params['userId']!);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const body = req.body as { roleIds: string[] };
    await adminRepo.replaceUserRoles(
      params['userId']!,
      body.roleIds,
      '00000000-0000-0000-0000-000000000000',
      req.userId!,
    );

    const updated = await adminRepo.findUserById(params['userId']!);
    sendSuccess(res, updated, undefined, 'User roles updated successfully');
  },
);

export const resetUserPassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const params = req.params as Record<string, string>;
    const existing = await adminRepo.findUserById(params['userId']!);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const body = req.body as { newPassword: string };
    await adminRepo.resetUserPassword(params['userId']!, body.newPassword);
    sendSuccess(res, null, undefined, 'Password reset successfully');
  },
);

export const listRoles = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const queryParams = req.query as Record<string, string | undefined>;
    const restaurantId = queryParams['restaurantId'];
    const roles = await adminRepo.findRoles(restaurantId);
    sendSuccess(res, roles);
  },
);

export const getRole = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const params = req.params as Record<string, string>;
    const role = await adminRepo.findRoleById(params['roleId']!);
    if (!role) {
      throw new NotFoundError('Role not found');
    }
    sendSuccess(res, role);
  },
);

export const createRole = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as { code: string };
    const existing = await adminRepo.findRoleByCode(body.code);
    if (existing) {
      throw new ConflictError('A role with this code already exists');
    }

    const role = await adminRepo.createRole(req.body);
    sendCreated(res, role, 'Role created successfully');
  },
);

export const updateRole = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const params = req.params as Record<string, string>;
    const existing = await adminRepo.findRoleById(params['roleId']!);
    if (!existing) {
      throw new NotFoundError('Role not found');
    }

    if (existing.isSystem) {
      throw new ForbiddenError('Cannot modify system roles');
    }

    const role = await adminRepo.updateRole(params['roleId']!, req.body);
    sendSuccess(res, role, undefined, 'Role updated successfully');
  },
);

export const deleteRole = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const params = req.params as Record<string, string>;
    const existing = await adminRepo.findRoleById(params['roleId']!);
    if (!existing) {
      throw new NotFoundError('Role not found');
    }

    if (existing.isSystem) {
      throw new ForbiddenError('Cannot delete system roles');
    }

    await adminRepo.deleteRole(params['roleId']!);
    sendNoContent(res);
  },
);

export const getRolePermissions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const params = req.params as Record<string, string>;
    const existing = await adminRepo.findRoleById(params['roleId']!);
    if (!existing) {
      throw new NotFoundError('Role not found');
    }

    const permissions = await adminRepo.findRolePermissions(params['roleId']!);
    sendSuccess(res, permissions);
  },
);

export const replaceRolePermissions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const params = req.params as Record<string, string>;
    const existing = await adminRepo.findRoleById(params['roleId']!);
    if (!existing) {
      throw new NotFoundError('Role not found');
    }

    if (existing.isSystem) {
      throw new ForbiddenError('Cannot modify system role permissions');
    }

    const body = req.body as { permissionIds: string[] };
    await adminRepo.replaceRolePermissions(params['roleId']!, body.permissionIds);

    const permissions = await adminRepo.findRolePermissions(params['roleId']!);
    sendSuccess(res, permissions, undefined, 'Role permissions updated successfully');
  },
);

export const listPermissions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const queryParams = req.query as Record<string, string | undefined>;
    const module = queryParams['module'];
    const permissions = await adminRepo.findPermissions(module);
    sendSuccess(res, permissions);
  },
);

export const getPermissionsGroups = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const groups = await adminRepo.findPermissionsGrouped();
    sendSuccess(res, groups);
  },
);
