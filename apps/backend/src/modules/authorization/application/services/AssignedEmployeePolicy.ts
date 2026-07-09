import type { AuthorizationContext } from "../../domain/models/AuthorizationContext.js";
import type { ResourceContext } from "../../domain/models/ResourceContext.js";
import type { AuthorizationPolicy, PolicyEvaluation } from "../../domain/services/AuthorizationPolicy.js";

export class AssignedEmployeePolicy implements AuthorizationPolicy {
  readonly name = "AssignedEmployeePolicy";

  async evaluate(
    user: AuthorizationContext,
    resource: ResourceContext
  ): Promise<PolicyEvaluation> {
    if (user.scope.type === "global") {
      return {
        allowed: true,
        policyName: this.name,
        reason: "Platform admin bypasses assignment check",
      };
    }

    if (!resource.assignedUserId) {
      return {
        allowed: false,
        policyName: this.name,
        reason: "Resource has no assigned user",
      };
    }

    if (resource.assignedUserId !== user.userId) {
      return {
        allowed: false,
        policyName: this.name,
        reason: `User "${user.userId}" is not the assigned employee ("${resource.assignedUserId}")`,
      };
    }

    return {
      allowed: true,
      policyName: this.name,
    };
  }
}
