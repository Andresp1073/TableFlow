import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../../../config/database.js";
import { logger as rootLogger } from "../../../../config/logger.js";
import type { PermissionResolutionContext, PermissionResolutionResult } from "../../domain/models/PermissionResolution.js";
import type { PermissionResolutionService } from "../../domain/services/PermissionResolutionService.js";
import type { CacheProvider } from "../../../../shared/cache/domain/CacheProvider.js";
import type { CacheKeyFactory } from "../../../../shared/cache/domain/CacheKeyFactory.js";
import type { CacheInvalidationService } from "../../../../shared/cache/domain/CacheInvalidationService.js";
import { UserNotFoundError } from "../../errors/UserNotFoundError.js";

const logger = rootLogger.child({ service: "PermissionResolutionService" });

export const PERMISSION_CACHE_TTL = 300_000;
const NEGATIVE_CACHE_TTL = 30_000;

export class PermissionResolutionServiceImpl implements PermissionResolutionService {
  private readonly requestCaches = new WeakMap<object, PermissionResolutionResult>();
  private readonly db: PrismaClient;
  private readonly cache: CacheProvider | null;
  private readonly keyFactory: CacheKeyFactory | null;
  readonly invalidationService: CacheInvalidationService | null;

  constructor(
    db?: PrismaClient,
    cache?: CacheProvider,
    keyFactory?: CacheKeyFactory,
    invalidationService?: CacheInvalidationService
  ) {
    this.db = db ?? prisma;
    this.cache = cache ?? null;
    this.keyFactory = keyFactory ?? null;
    this.invalidationService = invalidationService ?? null;
  }

  async resolve(context: PermissionResolutionContext, cacheKey?: object): Promise<PermissionResolutionResult> {
    if (cacheKey) {
      const cached = this.requestCaches.get(cacheKey);
      if (cached) {
        logger.debug({
          userId: context.userId,
          restaurantId: context.restaurantId,
          requestId: context.requestId,
          cacheHit: true,
          permissionCount: cached.permissions.size,
        }, "Permission resolution cache hit");
        return cached;
      }
    }

    const cacheProviderKey = this.getCacheKey(context);
    if (cacheProviderKey) {
      const cached = await this.cache!.get<PermissionResolutionResult>(cacheProviderKey);
      if (cached) {
        logger.debug({
          userId: context.userId,
          restaurantId: context.restaurantId,
          requestId: context.requestId,
          cacheProviderHit: true,
          permissionCount: cached.permissions.size,
        }, "Permission resolution cache provider hit");
        if (cacheKey) {
          this.requestCaches.set(cacheKey, cached);
        }
        return cached;
      }
    }

    logger.info({
      userId: context.userId,
      restaurantId: context.restaurantId,
      requestId: context.requestId,
    }, "Resolving permissions");

    const user = await this.db.user.findUnique({ where: { id: context.userId } });

    if (!user) {
      logger.warn({
        userId: context.userId,
        restaurantId: context.restaurantId,
        requestId: context.requestId,
      }, "Permission resolution failed: user not found");
      throw new UserNotFoundError(context.userId);
    }

    const userRoles = await this.db.userRole.findMany({
      where: {
        userId: context.userId,
        status: "active",
        role: {
          status: "active",
        },
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissionSet = new Set<string>();
    const roleIdSet = new Set<string>();
    const roleCodeSet = new Set<string>();

    for (const ur of userRoles) {
      const role = ur.role;

      if (role.restaurantId !== null && role.restaurantId !== context.restaurantId) {
        continue;
      }

      roleIdSet.add(role.id);
      roleCodeSet.add(role.code);

      for (const rp of role.rolePermissions) {
        permissionSet.add(rp.permission.code);
      }
    }

    const permissionCodes = Object.freeze(Array.from(permissionSet));

    const result: PermissionResolutionResult = {
      userId: context.userId,
      restaurantId: context.restaurantId,
      permissions: permissionSet as ReadonlySet<string>,
      permissionCodes,
      roleIds: Object.freeze(Array.from(roleIdSet)),
      roleCodes: Object.freeze(Array.from(roleCodeSet)),
      resolvedAt: new Date(),
    };

    if (cacheKey) {
      this.requestCaches.set(cacheKey, result);
    }

    const cacheTtl = permissionSet.size === 0 ? NEGATIVE_CACHE_TTL : PERMISSION_CACHE_TTL;
    if (cacheProviderKey) {
      await this.cache!.set(cacheProviderKey, result, cacheTtl);
    }

    logger.info({
      userId: context.userId,
      restaurantId: context.restaurantId,
      requestId: context.requestId,
      permissionCount: permissionSet.size,
      cacheHit: false,
    }, "Permissions resolved");

    return result;
  }

  private getCacheKey(context: PermissionResolutionContext): string | null {
    if (!this.cache || !this.keyFactory) {
      return null;
    }
    return this.keyFactory.userPermissions(context.userId, context.restaurantId);
  }
}
