import type { AuthorizationContext } from "../../domain/models/AuthorizationContext.js";
import type { ResourceContext } from "../../domain/models/ResourceContext.js";
import type { AuthorizationPolicy, PolicyEvaluation } from "../../domain/services/AuthorizationPolicy.js";

export class SameRestaurantPolicy implements AuthorizationPolicy {
  readonly name = "SameRestaurantPolicy";

  async evaluate(
    user: AuthorizationContext,
    resource: ResourceContext
  ): Promise<PolicyEvaluation> {
    if (user.scope.type === "global") {
      return {
        allowed: true,
        policyName: this.name,
        reason: "Platform admin bypasses restaurant isolation",
      };
    }

    if (user.organizationId !== resource.restaurantId) {
      return {
        allowed: false,
        policyName: this.name,
        reason: `User organization "${user.organizationId}" does not match resource restaurant "${resource.restaurantId}"`,
      };
    }

    return {
      allowed: true,
      policyName: this.name,
    };
  }
}
