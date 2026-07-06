import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../../../config/database.js";
import type { AuthorizationContext, UserRoleInfo } from "../../domain/models/AuthorizationContext.js";
import type { AuthorizationScope } from "../../domain/models/AuthorizationContext.js";
import type { AuthorizationService } from "./AuthorizationService.js";
import type { PermissionEvaluator } from "../../domain/services/PermissionEvaluator.js";
import { PermissionEvaluatorImpl } from "./PermissionEvaluatorImpl.js";
import { PermissionDeniedError } from "../../errors/PermissionDeniedError.js";
import { UnauthorizedRestaurantAccessError } from "../../errors/UnauthorizedRestaurantAccessError.js";

export class AuthorizationServiceImpl implements AuthorizationService {
  private readonly evaluator: PermissionEvaluator;
  private readonly db: PrismaClient;

  constructor(
    evaluator?: PermissionEvaluator,
    db?: PrismaClient
  ) {
    this.evaluator = evaluator ?? new PermissionEvaluatorImpl();
    this.db = db ?? prisma;
  }

  async authorize(
    context: AuthorizationContext,
    requiredPermission: string
  ): Promise<void> {
    const granted = await this.evaluator.hasPermission(
      context,
      requiredPermission
    );
    if (!granted) {
      throw new PermissionDeniedError(
        `Missing required permission: ${requiredPermission}`
      );
    }
  }

  async authorizeScoped(
    context: AuthorizationContext,
    requiredPermission: string,
    targetOrganizationId: string,
    targetBranchId?: string
  ): Promise<void> {
    await this.authorize(context, requiredPermission);

    const hasScope = await this.evaluator.evaluateScope(
      context,
      targetOrganizationId,
      targetBranchId
    );
    if (!hasScope) {
      throw new UnauthorizedRestaurantAccessError(
        `Access denied to organization: ${targetOrganizationId}`
      );
    }
  }

  async createContext(
    userId: string,
    organizationId: string,
    metadata?: { ip?: string; userAgent?: string; requestId?: string }
  ): Promise<AuthorizationContext> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new PermissionDeniedError("User not found");
    }

    const roles: UserRoleInfo[] = [];
    const permissionSet = new Set<string>();

    for (const userRole of user.userRoles) {
      const role = userRole.role;
      roles.push({
        roleId: role.id,
        roleCode: role.code,
        roleName: role.name,
        restaurantId: role.restaurantId,
        branchId: userRole.branchId,
      });
      for (const rp of role.rolePermissions) {
        permissionSet.add(rp.permission.code);
      }
    }

    const scope: AuthorizationScope =
      roles.some((r) => r.restaurantId === null)
        ? { type: "global" }
        : { type: "organization", organizationId };

    return {
      userId,
      organizationId,
      roles,
      permissions: Array.from(permissionSet),
      scope,
      sessionId: metadata?.requestId,
      requestMetadata: metadata,
    };
  }

  async getPermissions(context: AuthorizationContext): Promise<string[]> {
    return context.permissions;
  }

  setEvaluator(evaluator: PermissionEvaluator): void {
    this.evaluator = evaluator;
  }
}
