import { Router } from 'express';
import {
  getStats,
  listUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
  replaceUserRoles,
  resetUserPassword,
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  replaceRolePermissions,
  listPermissions,
  getPermissionsGroups,
} from './admin.controller.js';
import { validate } from '../../middlewares/validate.js';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import {
  listUsersSchema,
  userIdParamSchema,
  roleIdParamSchema,
  createUserSchema,
  updateUserSchema,
  replaceUserRolesSchema,
  resetPasswordSchema,
  listRolesSchema,
  createRoleSchema,
  updateRoleSchema,
  replaceRolePermissionsSchema,
  listPermissionsSchema,
} from './admin.validation.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('Super Admin'));

router.get('/stats', getStats);

router.get('/users', validate(listUsersSchema), listUsers);
router.get('/users/:userId', validate(userIdParamSchema), getUser);
router.post('/users', validate(createUserSchema), createUser);
router.patch('/users/:userId', validate(userIdParamSchema), validate(updateUserSchema), updateUser);
router.patch('/users/:userId/deactivate', validate(userIdParamSchema), deactivateUser);
router.patch('/users/:userId/activate', validate(userIdParamSchema), activateUser);
router.patch('/users/:userId/roles', validate(userIdParamSchema), validate(replaceUserRolesSchema), replaceUserRoles);
router.post('/users/:userId/reset-password', validate(userIdParamSchema), validate(resetPasswordSchema), resetUserPassword);

router.get('/roles', validate(listRolesSchema), listRoles);
router.get('/roles/:roleId', validate(roleIdParamSchema), getRole);
router.post('/roles', validate(createRoleSchema), createRole);
router.patch('/roles/:roleId', validate(roleIdParamSchema), validate(updateRoleSchema), updateRole);
router.delete('/roles/:roleId', validate(roleIdParamSchema), deleteRole);
router.get('/roles/:roleId/permissions', validate(roleIdParamSchema), getRolePermissions);
router.put('/roles/:roleId/permissions', validate(roleIdParamSchema), validate(replaceRolePermissionsSchema), replaceRolePermissions);

router.get('/permissions', validate(listPermissionsSchema), listPermissions);
router.get('/permissions/groups', getPermissionsGroups);

export default router;
