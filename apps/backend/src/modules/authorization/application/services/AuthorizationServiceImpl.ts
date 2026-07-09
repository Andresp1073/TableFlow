import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../../../config/database.js";
import type { AuthorizationContext, UserRoleInfo } from "../../domain/models/AuthorizationContext.js";
import type { AuthorizationScope } from "../../domain/models/AuthorizationContext.js";
import type { AuthorizationService } from "./AuthorizationService.js";
import type { PermissionEvaluator } from "../../domain/services/PermissionEvaluator.js";
import type { PermissionResolutionService } from "../../domain/services/PermissionResolutionService.js";
import { PermissionEvaluatorImpl } from "./PermissionEvaluatorImpl.js";
import { PermissionResolutionServiceImpl } from "../../infrastructure/services/PermissionResolutionServiceImpl.js";
import { PermissionDeniedError } from "../../errors/PermissionDeniedError.js";
import { UnauthorizedRestaurantAccessError } from "../../errors/UnauthorizedRestaurantAccessError.js";

export class AuthorizationServiceImpl implements AuthorizationService {
  private readonly evaluator: PermissionEvaluator;
  private readonly resolver: PermissionResolutionService;
  private readonly db: PrismaClient;

  constructor(
    evaluator?: PermissionEvaluator,
    resolver?: PermissionResolutionService,
    db?: PrismaClient
  ) {
    this.evaluator = evaluator ?? new PermissionEvaluatorImpl();
    this.resolver = resolver ?? new PermissionResolutionServiceImpl();
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
    const [resolved, userRoles] = await Promise.all([
      this.resolver.resolve({
        userId,
        restaurantId: organizationId,
        organizationId,
        requestId: metadata?.requestId,
      }),
      this.db.userRole.findMany({
        where: { userId },
        include: { role: true },
      }),
    ]);

    const roles: UserRoleInfo[] = userRoles.map((ur) => ({
      roleId: ur.role.id,
      roleCode: ur.role.code,
      roleName: ur.role.name,
      restaurantId: ur.role.restaurantId,
      branchId: ur.branchId,
    }));

    const scope: AuthorizationScope =
      userRoles.some((ur) => ur.role.restaurantId === null)
        ? { type: "global" }
        : { type: "organization", organizationId };

    return {
      userId,
      organizationId,
      roles,
      permissions: Array.from(resolved.permissionCodes),
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
