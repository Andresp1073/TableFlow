import { BaseRepository } from '../shared/BaseRepository.js';
import type { Prisma } from '@prisma/client';
import { hashPassword } from '../auth/auth.utils.js';
import type { PlatformStats, AdminUser, AdminRole, AdminPermission, PermissionGroup } from './admin.types.js';

type PrismaUser = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: true;
      };
    };
  };
}>;

function mapUser(user: PrismaUser): AdminUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    isActive: user.isActive,
    isVerified: user.isVerified,
    failedLoginAttempts: user.failedLoginAttempts,
    lastFailedLoginAt: user.lastFailedLoginAt?.toISOString() ?? null,
    lockedAt: user.lockedAt?.toISOString() ?? null,
    lockedUntil: user.lockedUntil?.toISOString() ?? null,
    lockReason: user.lockReason,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    userRoles: user.userRoles.map((ur) => ({
      id: ur.id,
      roleId: ur.roleId,
      restaurantId: ur.restaurantId,
      branchId: ur.branchId,
      status: ur.status,
      expiresAt: ur.expiresAt?.toISOString() ?? null,
      assignedAt: ur.assignedAt.toISOString(),
      role: {
        id: ur.role.id,
        code: ur.role.code,
        name: ur.role.name,
        description: ur.role.description,
        isSystem: ur.role.isSystem,
        isDefault: ur.role.isDefault,
        priority: ur.role.priority,
        color: ur.role.color,
        status: ur.role.status,
      },
    })),
  };
}

export class AdminRepository extends BaseRepository {
  async findUsers(params: {
    skip: number;
    take: number;
    search?: string;
    role?: string;
    status?: string;
    organizationId?: string;
  }): Promise<AdminUser[]> {
    const where: Prisma.UserWhereInput = {};

    if (params.organizationId) {
      where.organizationId = params.organizationId;
    }

    if (params.search) {
      const searchLower = params.search.toLowerCase();
      where.OR = [
        { email: { contains: searchLower } },
        { firstName: { contains: searchLower } },
        { lastName: { contains: searchLower } },
      ];
    }

    if (params.role) {
      where.userRoles = {
        some: {
          role: { code: params.role },
        },
      };
    }

    if (params.status === 'active') {
      where.isActive = true;
      where.AND = [{ OR: [{ lockedUntil: null }, { lockedUntil: { lte: new Date() } }] }];
    } else if (params.status === 'inactive') {
      where.isActive = false;
    } else if (params.status === 'locked') {
      where.lockedUntil = { gt: new Date() };
    }

    const users = await this.prisma.user.findMany({
      where,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    });

    return users.map(mapUser);
  }

  async countUsers(params: {
    search?: string;
    role?: string;
    status?: string;
    organizationId?: string;
  }): Promise<number> {
    const where: Prisma.UserWhereInput = {};

    if (params.organizationId) {
      where.organizationId = params.organizationId;
    }

    if (params.search) {
      const searchLower = params.search.toLowerCase();
      where.OR = [
        { email: { contains: searchLower } },
        { firstName: { contains: searchLower } },
        { lastName: { contains: searchLower } },
      ];
    }

    if (params.role) {
      where.userRoles = {
        some: {
          role: { code: params.role },
        },
      };
    }

    if (params.status === 'active') {
      where.isActive = true;
      where.lockedUntil = null;
    } else if (params.status === 'inactive') {
      where.isActive = false;
    } else if (params.status === 'locked') {
      where.lockedUntil = { gt: new Date() };
    }

    return this.prisma.user.count({ where });
  }

  async findUserById(id: string): Promise<AdminUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return user ? mapUser(user) : null;
  }

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    organizationId: string;
  }): Promise<AdminUser> {
    const passwordHash = await hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
        organizationId: data.organizationId,
        isActive: true,
        isVerified: false,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return mapUser(user);
  }

  async updateUser(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      isActive?: boolean;
    },
  ): Promise<AdminUser> {
    const updateData: Prisma.UserUpdateInput = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email.toLowerCase().trim();
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return mapUser(user);
  }

  async deactivateUser(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activateUser(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        lockedAt: null,
        lockedUntil: null,
        lockReason: null,
        failedLoginAttempts: 0,
      },
    });
  }

  async resetUserPassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async findRoles(restaurantId?: string): Promise<AdminRole[]> {
    const where: Prisma.RoleWhereInput = {};
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const roles = await this.prisma.role.findMany({
      where,
      include: {
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true,
          },
        },
      },
      orderBy: { priority: 'asc' },
    });

    return roles.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      restaurantId: r.restaurantId,
      isSystem: r.isSystem,
      isDefault: r.isDefault,
      priority: r.priority,
      color: r.color,
      icon: r.icon,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      _count: {
        userRoles: r._count.userRoles,
        rolePermissions: r._count.rolePermissions,
      },
    }));
  }

  async findRoleById(id: string): Promise<AdminRole | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true,
          },
        },
      },
    });

    if (!role) return null;

    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      restaurantId: role.restaurantId,
      isSystem: role.isSystem,
      isDefault: role.isDefault,
      priority: role.priority,
      color: role.color,
      icon: role.icon,
      status: role.status,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      _count: {
        userRoles: role._count.userRoles,
        rolePermissions: role._count.rolePermissions,
      },
    };
  }

  async findRoleByCode(code: string): Promise<AdminRole | null> {
    const role = await this.prisma.role.findFirst({
      where: { code },
    });

    if (!role) return null;

    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      restaurantId: role.restaurantId,
      isSystem: role.isSystem,
      isDefault: role.isDefault,
      priority: role.priority,
      color: role.color,
      icon: role.icon,
      status: role.status,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }

  async createRole(data: {
    code: string;
    name: string;
    description?: string;
    restaurantId?: string;
    isDefault?: boolean;
    priority?: number;
    color?: string;
    icon?: string;
  }): Promise<AdminRole> {
    const role = await this.prisma.role.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        restaurantId: data.restaurantId ?? null,
        isSystem: false,
        isDefault: data.isDefault ?? false,
        priority: data.priority ?? 0,
        color: data.color ?? null,
        icon: data.icon ?? null,
        status: 'active',
      },
    });

    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      restaurantId: role.restaurantId,
      isSystem: role.isSystem,
      isDefault: role.isDefault,
      priority: role.priority,
      color: role.color,
      icon: role.icon,
      status: role.status,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }

  async updateRole(
    id: string,
    data: {
      name?: string;
      description?: string;
      isDefault?: boolean;
      priority?: number;
      color?: string;
      icon?: string;
      status?: string;
    },
  ): Promise<AdminRole> {
    const updateData: Prisma.RoleUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.status !== undefined) updateData.status = data.status;

    const role = await this.prisma.role.update({
      where: { id },
      data: updateData,
    });

    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      restaurantId: role.restaurantId,
      isSystem: role.isSystem,
      isDefault: role.isDefault,
      priority: role.priority,
      color: role.color,
      icon: role.icon,
      status: role.status,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }

  async deleteRole(id: string): Promise<void> {
    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await this.prisma.userRole.deleteMany({ where: { roleId: id } });
    await this.prisma.role.delete({ where: { id } });
  }

  async findPermissions(module?: string): Promise<AdminPermission[]> {
    const where: Prisma.PermissionWhereInput = {};
    if (module) {
      where.module = module;
    }

    const permissions = await this.prisma.permission.findMany({
      where,
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });

    return permissions.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      module: p.module,
      resource: p.resource,
      action: p.action,
      riskLevel: p.riskLevel,
      isSystem: p.isSystem,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  async findPermissionsGrouped(): Promise<PermissionGroup[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });

    const grouped: Record<string, AdminPermission[]> = {};

    for (const p of permissions) {
      if (!grouped[p.module]) {
        grouped[p.module] = [];
      }
      grouped[p.module]!.push({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        module: p.module,
        resource: p.resource,
        action: p.action,
        riskLevel: p.riskLevel,
        isSystem: p.isSystem,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      });
    }

    return Object.entries(grouped).map(([module, perms]) => ({
      module,
      permissions: perms,
    }));
  }

  async findRolePermissions(roleId: string): Promise<AdminPermission[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });

    return rolePermissions.map((rp) => ({
      id: rp.permission.id,
      code: rp.permission.code,
      name: rp.permission.name,
      description: rp.permission.description,
      module: rp.permission.module,
      resource: rp.permission.resource,
      action: rp.permission.action,
      riskLevel: rp.permission.riskLevel,
      isSystem: rp.permission.isSystem,
      createdAt: rp.permission.createdAt.toISOString(),
      updatedAt: rp.permission.updatedAt.toISOString(),
    }));
  }

  async replaceRolePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }
    });
  }

  async replaceUserRoles(
    userId: string,
    roleIds: string[],
    restaurantId: string,
    assignedBy: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: { userId, restaurantId },
      });

      if (roleIds.length > 0) {
        const roles = await tx.role.findMany({
          where: { id: { in: roleIds } },
          select: { id: true, restaurantId: true },
        });

        await tx.userRole.createMany({
          data: roles.map((role) => ({
            userId,
            roleId: role.id,
            restaurantId: role.restaurantId ?? restaurantId,
            assignedBy,
            status: 'active',
          })),
        });
      }
    });
  }

  async getPlatformStats(): Promise<PlatformStats> {
    const [
      totalUsers,
      activeUsers,
      lockedUsers,
      unverifiedUsers,
      totalRestaurants,
      activeRestaurants,
      totalRoles,
      totalPermissions,
      recentLogins,
      activeSessions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { isActive: true, OR: [{ lockedUntil: null }, { lockedUntil: { lte: new Date() } }] },
      }),
      this.prisma.user.count({
        where: { lockedUntil: { gt: new Date() } },
      }),
      this.prisma.user.count({
        where: { isVerified: false },
      }),
      this.prisma.organization.count(),
      this.prisma.organization.count({ where: { status: 'active' } }),
      this.prisma.role.count(),
      this.prisma.permission.count(),
      this.prisma.user.count({
        where: { lastLoginAt: { gte: new Date(Date.now() - 86_400_000) } },
      }),
      this.prisma.refreshToken.count({
        where: {
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      lockedUsers,
      unverifiedUsers,
      totalRestaurants,
      activeRestaurants,
      totalRoles,
      totalPermissions,
      recentLogins,
      activeSessions,
    };
  }
}
