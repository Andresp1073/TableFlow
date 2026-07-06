import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../../middlewares/auth.js";
import type { AuthorizationService } from "../application/services/AuthorizationService.js";
import { AuthorizationServiceImpl } from "../application/services/AuthorizationServiceImpl.js";
import { getCache, setCache, createCachedPermissions } from "./PermissionCache.js";

const defaultService = new AuthorizationServiceImpl();

export function enrichContext(
  service?: AuthorizationService
) {
  const authz = service ?? defaultService;

  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.userId || !req.organizationId) {
      next();
      return;
    }

    try {
      const cached = getCache(req);
      if (cached) {
        req.authContext = {
          userId: req.userId,
          organizationId: req.organizationId,
          roles: [],
          permissions: Array.from(cached.permissions),
          scope: { type: "organization", organizationId: req.organizationId },
          sessionId: req.jti,
          requestMetadata: {
            requestId: req.requestId,
          },
        };
        next();
        return;
      }

      const context = await authz.createContext(
        req.userId,
        req.organizationId,
        {
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
        }
      );

      req.authContext = context;

      const cache = createCachedPermissions();
      for (const p of context.permissions) {
        cache.permissions.add(p);
      }
      for (const r of context.roles) {
        cache.roleCodes.add(r.roleCode);
      }
      setCache(req, cache);

      next();
    } catch (error) {
      next(error);
    }
  };
}
