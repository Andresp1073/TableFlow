import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../../middlewares/auth.js";
import type { AuthorizationService } from "../application/services/AuthorizationService.js";
import type { PermissionResolutionService } from "../domain/services/PermissionResolutionService.js";
import { ForbiddenError } from "../../../errors/ForbiddenError.js";
import { UnauthorizedError } from "../../../errors/UnauthorizedError.js";
import { AuthorizationServiceImpl } from "../application/services/AuthorizationServiceImpl.js";
import { PermissionResolutionServiceImpl } from "../infrastructure/services/PermissionResolutionServiceImpl.js";
import { PermissionEvaluatorImpl } from "../application/services/PermissionEvaluatorImpl.js";
import { getCache } from "./PermissionCache.js";
import { logger } from "../../../config/logger.js";

const defaultAuthz = new AuthorizationServiceImpl();
const defaultEvaluator = new PermissionEvaluatorImpl();
const defaultResolver = new PermissionResolutionServiceImpl();

function getRequestLogger(req: AuthenticatedRequest) {
  return {
    userId: req.userId,
    organizationId: req.organizationId,
    requestId: req.requestId,
    ip: req.ip,
  };
}

async function resolvePermissions(req: AuthenticatedRequest, resolver?: PermissionResolutionService): Promise<Set<string>> {
  if (req.authContext?.permissions) {
    return new Set(req.authContext.permissions);
  }

  const cached = getCache(req);
  if (cached) {
    return cached.permissions;
  }

  if (req.userId && req.organizationId) {
    const r = resolver ?? defaultResolver;
    try {
      const resolved = await r.resolve(
        {
          userId: req.userId,
          restaurantId: req.organizationId,
          organizationId: req.organizationId,
          requestId: req.requestId,
        },
        req
      );
      return resolved.permissions as Set<string>;
    } catch {
      return new Set<string>();
    }
  }

  return new Set<string>();
}

async function resolveRoleCodes(req: AuthenticatedRequest, resolver?: PermissionResolutionService): Promise<Set<string>> {
  if (req.authContext?.roles) {
    return new Set(req.authContext.roles.map((r) => r.roleCode));
  }

  const cached = getCache(req);
  if (cached) {
    return cached.roleCodes;
  }

  if (req.userId && req.organizationId) {
    const r = resolver ?? defaultResolver;
    try {
      const resolved = await r.resolve(
        {
          userId: req.userId,
          restaurantId: req.organizationId,
          organizationId: req.organizationId,
          requestId: req.requestId,
        },
        req
      );
      return new Set(resolved.roleCodes);
    } catch {
      return new Set<string>();
    }
  }

  return new Set<string>();
}

export function requirePermission(
  permissionCode: string,
  service?: AuthorizationService,
  resolver?: PermissionResolutionService
) {
  const authz = service ?? defaultAuthz;

  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.userId) {
      const base = getRequestLogger(req);
      logger.warn({ ...base, reason: "no_auth", permission: permissionCode }, "Authorization denied: no authentication");
      next(new UnauthorizedError());
      return;
    }

    try {
      if (req.authContext) {
        await authz.authorize(req.authContext, permissionCode);
        next();
        return;
      }

      const perms = await resolvePermissions(req, resolver);
      if (perms.has(permissionCode)) {
        next();
        return;
      }

      const base = getRequestLogger(req);
      logger.warn(
        { ...base, reason: "permission_denied", permission: permissionCode },
        `Permission denied: ${permissionCode}`
      );
      next(new ForbiddenError("Missing required permission"));
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
        const base = getRequestLogger(req);
        logger.warn(
          { ...base, reason: "permission_denied", permission: permissionCode },
          `Permission denied: ${permissionCode}`
        );
      }
      next(error);
    }
  };
}

export function requireAnyPermission(
  permissionCodes: string[],
  _service?: AuthorizationService,
  resolver?: PermissionResolutionService
) {
  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.userId) {
      const base = getRequestLogger(req);
      logger.warn({ ...base, reason: "no_auth", permissions: permissionCodes }, "Authorization denied: no authentication");
      next(new UnauthorizedError());
      return;
    }

    try {
      const perms = req.authContext
        ? new Set(req.authContext.permissions)
        : await resolvePermissions(req, resolver);

      const hasAny = permissionCodes.some((code) => perms.has(code));

      if (hasAny) {
        next();
        return;
      }

      const base = getRequestLogger(req);
      logger.warn(
        { ...base, reason: "any_permission_denied", permissions: permissionCodes },
        `No matching permission in: ${permissionCodes.join(", ")}`
      );
      next(new ForbiddenError("Missing required permission"));
    } catch (error) {
      next(error);
    }
  };
}

export function requireRole(roleCode: string, resolver?: PermissionResolutionService) {
  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.userId) {
      const base = getRequestLogger(req);
      logger.warn({ ...base, reason: "no_auth", role: roleCode }, "Role check denied: no authentication");
      next(new UnauthorizedError());
      return;
    }

    const roleCodes = await resolveRoleCodes(req, resolver);
    if (roleCodes.has(roleCode)) {
      next();
      return;
    }

    const base = getRequestLogger(req);
    logger.warn(
      { ...base, reason: "role_mismatch", requiredRole: roleCode, userRoles: Array.from(roleCodes) },
      `Role check denied: ${roleCode}`
    );
    next(new ForbiddenError("Insufficient role privileges"));
  };
}

export function requireRestaurantAccess(
  paramName: string = "restaurantId",
  resolver?: PermissionResolutionService
) {
  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.userId || !req.organizationId) {
      const base = getRequestLogger(req);
      logger.warn({ ...base, reason: "no_auth" }, "Restaurant access denied: no authentication");
      next(new UnauthorizedError());
      return;
    }

    const targetOrgId = req.params[paramName] ?? req.organizationId;

    if (!targetOrgId) {
      next(new ForbiddenError("Missing restaurant identifier"));
      return;
    }

    if (req.authContext) {
      const evaluator = defaultEvaluator;
      const hasScope = await evaluator.evaluateScope(req.authContext, targetOrgId);

      if (!hasScope) {
        const base = getRequestLogger(req);
        logger.warn(
          { ...base, reason: "restaurant_access_denied", targetOrgId },
          "Restaurant access denied"
        );
        next(new ForbiddenError("Access denied to this restaurant"));
        return;
      }

      next();
      return;
    }

    const resolved = await resolvePermissions(req, resolver);
    if (resolved.size === 0 && req.organizationId !== targetOrgId) {
      const base = getRequestLogger(req);
      logger.warn(
        { ...base, reason: "restaurant_access_denied", targetOrgId },
        "Restaurant access denied"
      );
      next(new ForbiddenError("Access denied to this restaurant"));
      return;
    }

    next();
  };
}
