import type { AuthorizationContext } from "../../domain/models/AuthorizationContext.js";
import type { ResourceContext } from "../../domain/models/ResourceContext.js";
import type { AuthorizationPolicy, PolicyEvaluation } from "../../domain/services/AuthorizationPolicy.js";

export class OwnerPolicy implements AuthorizationPolicy {
  readonly name = "OwnerPolicy";

  constructor(
    private readonly ownerField: keyof Pick<ResourceContext, "ownerUserId" | "createdByUserId" | "assignedUserId" | "employeeUserId"> = "ownerUserId"
  ) {}

  async evaluate(
    user: AuthorizationContext,
    resource: ResourceContext
  ): Promise<PolicyEvaluation> {
    if (user.scope.type === "global") {
      return {
        allowed: true,
        policyName: this.name,
        reason: "Platform admin bypasses ownership check",
      };
    }

    const resourceOwnerId = resource[this.ownerField];

    if (!resourceOwnerId) {
      return {
        allowed: false,
        policyName: this.name,
        reason: `Resource has no ${this.ownerField}`,
      };
    }

    if (resourceOwnerId !== user.userId) {
      return {
        allowed: false,
        policyName: this.name,
        reason: `User "${user.userId}" is not the ${this.ownerField} ("${resourceOwnerId}")`,
      };
    }

    return {
      allowed: true,
      policyName: this.name,
    };
  }
}
