import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../../middlewares/auth.js";
import type { AuthorizationService } from "../application/services/AuthorizationService.js";
import type { PermissionResolutionService } from "../domain/services/PermissionResolutionService.js";
import { AuthorizationServiceImpl } from "../application/services/AuthorizationServiceImpl.js";
import { PermissionResolutionServiceImpl } from "../infrastructure/services/PermissionResolutionServiceImpl.js";
import { getCache, setCache, createCachedPermissions } from "./PermissionCache.js";

const defaultService = new AuthorizationServiceImpl();
const defaultResolver = new PermissionResolutionServiceImpl();

export function enrichContext(
  service?: AuthorizationService,
  resolver?: PermissionResolutionService
) {
  const authz = service ?? defaultService;
  const permissionResolver = resolver ?? defaultResolver;

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
        const resolved = await permissionResolver.resolve(
          {
            userId: req.userId,
            restaurantId: req.organizationId,
            organizationId: req.organizationId,
            requestId: req.requestId,
          },
          req
        );

        req.authContext = {
          userId: req.userId,
          organizationId: req.organizationId,
          roles: [],
          permissions: Array.from(resolved.permissionCodes),
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
