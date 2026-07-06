import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../../middlewares/auth.js";
import type { AuthorizationService } from "../application/services/AuthorizationService.js";
import { ForbiddenError } from "../../../errors/ForbiddenError.js";
import { UnauthorizedError } from "../../../errors/UnauthorizedError.js";
import { AuthorizationServiceImpl } from "../application/services/AuthorizationServiceImpl.js";
import { PermissionEvaluatorImpl } from "../application/services/PermissionEvaluatorImpl.js";
import { getCache } from "./PermissionCache.js";
import { logger } from "../../../config/logger.js";

const defaultAuthz = new AuthorizationServiceImpl();
const defaultEvaluator = new PermissionEvaluatorImpl();

function getRequestLogger(req: AuthenticatedRequest) {
  return {
    userId: req.userId,
    organizationId: req.organizationId,
    requestId: req.requestId,
    ip: req.ip,
  };
}

function getPermissionSet(req: AuthenticatedRequest): Set<string> {
  if (req.authContext?.permissions) {
    return new Set(req.authContext.permissions);
  }
  const cached = getCache(req);
  if (cached) {
    return cached.permissions;
  }
  return new Set<string>();
}

function getRoleCodes(req: AuthenticatedRequest): Set<string> {
  if (req.authContext?.roles) {
    return new Set(req.authContext.roles.map((r) => r.roleCode));
  }
  const cached = getCache(req);
  if (cached) {
    return cached.roleCodes;
  }
  return new Set<string>();
}

export function requirePermission(
  permissionCode: string,
  service?: AuthorizationService
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
      const context = req.authContext;
      if (context) {
        await authz.authorize(context, permissionCode);
        next();
        return;
      }

      const perms = getPermissionSet(req);
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
  service?: AuthorizationService
) {
  const authz = service ?? defaultAuthz;

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
      const context = req.authContext;
      const perms = context
        ? new Set(context.permissions)
        : getPermissionSet(req);
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

export function requireRole(roleCode: string) {
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

    const roleCodes = getRoleCodes(req);
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
  paramName: string = "restaurantId"
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

    const context = req.authContext;
    if (!context) {
      next(new ForbiddenError("Authorization context not available"));
      return;
    }

    const evaluator = defaultEvaluator;
    const hasScope = await evaluator.evaluateScope(context, targetOrgId);

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
  };
}
