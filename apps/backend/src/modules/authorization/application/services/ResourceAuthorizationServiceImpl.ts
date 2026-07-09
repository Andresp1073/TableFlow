import type { AuthorizationContext } from "../../domain/models/AuthorizationContext.js";
import type { ResourceContext } from "../../domain/models/ResourceContext.js";
import type { AuthorizationPolicy, PolicyEvaluation } from "../../domain/services/AuthorizationPolicy.js";
import type { PolicyEvaluator } from "../../domain/services/PolicyEvaluator.js";
import type { ResourceAuthorizationService } from "../../domain/services/ResourceAuthorizationService.js";
import { PolicyEvaluatorImpl } from "./PolicyEvaluatorImpl.js";
import { PlatformAdminPolicy } from "./PlatformAdminPolicy.js";
import { SameRestaurantPolicy } from "./SameRestaurantPolicy.js";
import { OwnerPolicy } from "./OwnerPolicy.js";
import { AssignedEmployeePolicy } from "./AssignedEmployeePolicy.js";
import { ResourceForbiddenError } from "../../errors/ResourceForbiddenError.js";
import { logger } from "../../../../config/logger.js";

const log = logger.child({ service: "ResourceAuthorizationService" });

export class ResourceAuthorizationServiceImpl implements ResourceAuthorizationService {
  private readonly evaluator: PolicyEvaluator;
  private readonly platformAdminPolicy: PlatformAdminPolicy;

  constructor(evaluator?: PolicyEvaluator) {
    this.evaluator = evaluator ?? new PolicyEvaluatorImpl();
    this.platformAdminPolicy = new PlatformAdminPolicy();
  }

  private async isPlatformAdmin(
    user: AuthorizationContext,
    resource: ResourceContext
  ): Promise<boolean> {
    const result = await this.platformAdminPolicy.evaluate(user, resource);
    return result.allowed;
  }

  async canAccessRestaurant(
    user: AuthorizationContext,
    restaurantId: string
  ): Promise<boolean> {
    const resource: ResourceContext = {
      resourceType: "restaurant",
      resourceId: restaurantId,
      restaurantId,
    };

    if (await this.isPlatformAdmin(user, resource)) {
      log.info({
        userId: user.userId, restaurantId, allowed: true, reason: "Platform admin override",
      }, "Restaurant access check");
      return true;
    }

    const result = await this.evaluator.evaluate(user, resource, [
      new SameRestaurantPolicy(),
    ]);

    log.info({
      userId: user.userId, restaurantId, allowed: result.allowed, reason: result.reason,
    }, "Restaurant access check");

    return result.allowed;
  }

  async canModifyReservation(
    user: AuthorizationContext,
    resource: ResourceContext
  ): Promise<boolean> {
    if (await this.isPlatformAdmin(user, resource)) return true;

    const sameRestaurant = await this.evaluator.evaluate(user, resource, [
      new SameRestaurantPolicy(),
    ]);
    if (!sameRestaurant.allowed) {
      log.warn({
        userId: user.userId,
        resourceType: resource.resourceType,
        resourceId: resource.resourceId,
        reason: sameRestaurant.reason,
      }, "Reservation modification denied");
      return false;
    }

    const ownerResult = await new OwnerPolicy("ownerUserId").evaluate(user, resource);
    if (ownerResult.allowed) return true;

    const assignedResult = await new AssignedEmployeePolicy().evaluate(user, resource);
    if (!assignedResult.allowed) {
      log.warn({
        userId: user.userId,
        resourceType: resource.resourceType,
        resourceId: resource.resourceId,
      }, "Reservation modification denied");
    }

    return assignedResult.allowed;
  }

  async canManageEmployee(
    user: AuthorizationContext,
    resource: ResourceContext
  ): Promise<boolean> {
    if (await this.isPlatformAdmin(user, resource)) return true;

    const result = await this.evaluator.evaluate(user, resource, [
      new SameRestaurantPolicy(),
    ]);

    if (!result.allowed) {
      log.warn({
        userId: user.userId,
        resourceType: resource.resourceType,
        resourceId: resource.resourceId,
        reason: result.reason,
      }, "Employee management denied");
    }

    return result.allowed;
  }

  async canAccessUser(
    user: AuthorizationContext,
    resource: ResourceContext
  ): Promise<boolean> {
    if (await this.isPlatformAdmin(user, resource)) return true;

    if (resource.restaurantId) {
      const sameRestaurant = await this.evaluator.evaluate(user, resource, [
        new SameRestaurantPolicy(),
      ]);
      if (!sameRestaurant.allowed) {
        log.warn({
          userId: user.userId,
          resourceType: resource.resourceType,
          resourceId: resource.resourceId,
          reason: sameRestaurant.reason,
        }, "User access denied");
        return false;
      }
    }

    const ownerResult = await new OwnerPolicy("ownerUserId").evaluate(user, resource);
    if (ownerResult.allowed) return true;

    const creatorResult = await new OwnerPolicy("createdByUserId").evaluate(user, resource);
    if (!creatorResult.allowed) {
      log.warn({
        userId: user.userId,
        resourceType: resource.resourceType,
        resourceId: resource.resourceId,
      }, "User access denied");
    }

    return creatorResult.allowed;
  }

  async evaluatePolicy(
    user: AuthorizationContext,
    resource: ResourceContext,
    ...policyNames: string[]
  ): Promise<PolicyEvaluation> {
    const allPolicies: AuthorizationPolicy[] = [
      new PlatformAdminPolicy(),
      new SameRestaurantPolicy(),
      new OwnerPolicy("ownerUserId"),
      new OwnerPolicy("createdByUserId"),
      new AssignedEmployeePolicy(),
    ];

    const selected = policyNames.length === 0
      ? allPolicies
      : policyNames.reduce<AuthorizationPolicy[]>((acc, name) => {
          const policy = allPolicies.find((p) => p.name === name);
          if (policy) acc.push(policy);
          return acc;
        }, []);

    return this.evaluator.evaluate(user, resource, selected);
  }

  private throwIfDenied(result: PolicyEvaluation, resource: ResourceContext): void {
    if (!result.allowed) {
      throw new ResourceForbiddenError(
        resource.resourceType,
        resource.resourceId,
        result.reason ?? "Access denied by policy"
      );
    }
  }
}
