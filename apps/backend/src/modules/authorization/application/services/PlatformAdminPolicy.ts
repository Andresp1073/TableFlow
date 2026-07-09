import type { AuthorizationContext } from "../../domain/models/AuthorizationContext.js";
import type { ResourceContext } from "../../domain/models/ResourceContext.js";
import type { AuthorizationPolicy, PolicyEvaluation } from "../../domain/services/AuthorizationPolicy.js";

export class PlatformAdminPolicy implements AuthorizationPolicy {
  readonly name = "PlatformAdminPolicy";

  async evaluate(
    user: AuthorizationContext,
    _resource: ResourceContext
  ): Promise<PolicyEvaluation> {
    if (user.scope.type === "global") {
      return {
        allowed: true,
        policyName: this.name,
        reason: "Platform admin: global scope override",
      };
    }

    return {
      allowed: false,
      policyName: this.name,
    };
  }
}
