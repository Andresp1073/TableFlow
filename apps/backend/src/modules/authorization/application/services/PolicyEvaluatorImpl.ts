import type { AuthorizationContext } from "../../domain/models/AuthorizationContext.js";
import type { ResourceContext } from "../../domain/models/ResourceContext.js";
import type { AuthorizationPolicy, PolicyEvaluation } from "../../domain/services/AuthorizationPolicy.js";
import type { PolicyEvaluator } from "../../domain/services/PolicyEvaluator.js";
import { logger } from "../../../../config/logger.js";

const log = logger.child({ service: "PolicyEvaluator" });

export class PolicyEvaluatorImpl implements PolicyEvaluator {
  async evaluate(
    user: AuthorizationContext,
    resource: ResourceContext,
    policies: AuthorizationPolicy[]
  ): Promise<PolicyEvaluation> {
    for (const policy of policies) {
      const result = await policy.evaluate(user, resource);

      log.debug({
        userId: user.userId,
        resourceType: resource.resourceType,
        resourceId: resource.resourceId,
        policy: policy.name,
        allowed: result.allowed,
        reason: result.reason,
      }, "Policy evaluation");

      if (!result.allowed) {
        log.warn({
          userId: user.userId,
          resourceType: resource.resourceType,
          resourceId: resource.resourceId,
          restaurantId: resource.restaurantId,
          denyingPolicy: policy.name,
          reason: result.reason,
        }, "Resource authorization denied");

        return result;
      }
    }

    return {
      allowed: true,
      policyName: "PolicyEvaluator",
      reason: "All policies passed",
    };
  }

  async evaluateAll(
    user: AuthorizationContext,
    resource: ResourceContext,
    policies: AuthorizationPolicy[]
  ): Promise<PolicyEvaluation[]> {
    const results: PolicyEvaluation[] = [];

    for (const policy of policies) {
      const result = await policy.evaluate(user, resource);

      log.debug({
        userId: user.userId,
        resourceType: resource.resourceType,
        resourceId: resource.resourceId,
        policy: policy.name,
        allowed: result.allowed,
        reason: result.reason,
      }, "Policy evaluation");

      results.push(result);
    }

    return results;
  }
}
