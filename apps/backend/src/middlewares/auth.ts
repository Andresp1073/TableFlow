import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { ForbiddenError } from '../errors/ForbiddenError.js';
import { env } from '../config/env.js';
import { prisma } from '../config/database.js';
import type { AuthorizationContext } from '../modules/authorization/domain/models/AuthorizationContext.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  organizationId?: string;
  role?: string;
  permissions?: string[];
  /** JWT Token ID — used for session management */
  jti?: string;
  /** Full authorization context built by enrichContext middleware */
  authContext?: AuthorizationContext;
  /** Unique request ID added by requestId middleware */
  requestId: string;
}

export function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Authentication required', 'auth.token.missing'));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      organizationId: string;
      role: string;
      jti: string;
    };

    req.userId = payload.sub;
    req.organizationId = payload.organizationId;
    req.role = payload.role;
    req.jti = payload.jti;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Access token expired', 'auth.token.expired'));
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid access token', 'auth.token.invalid'));
      return;
    }
    next(new UnauthorizedError('Authentication failed', 'auth.token.invalid'));
  }
}

export async function requirePermission(...permissions: string[]) {
  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.userId) {
      next(new UnauthorizedError());
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: {
          userRoles: {
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
          },
        },
      });

      if (!user || !user.isActive) {
        next(new UnauthorizedError('User not found or inactive'));
        return;
      }

      const userPermissions = new Set<string>();
      for (const userRole of user.userRoles) {
        for (const rp of userRole.role.rolePermissions) {
          userPermissions.add(rp.permission.code);
        }
      }

      const hasPermission = permissions.some((p) =>
        userPermissions.has(p)
      );

      if (!hasPermission) {
        next(new ForbiddenError('Missing required permission'));
        return;
      }

      req.permissions = Array.from(userPermissions);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireRole(...roles: string[]) {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.role || !roles.includes(req.role)) {
      next(new ForbiddenError('Insufficient role privileges'));
      return;
    }
    next();
  };
}
