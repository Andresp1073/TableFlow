import type { AuthorizationContext } from "../models/AuthorizationContext.js";
import type { ResourceContext } from "../models/ResourceContext.js";

export interface PolicyEvaluation {
  allowed: boolean;
  policyName: string;
  reason?: string;
}

export interface AuthorizationPolicy {
  readonly name: string;
  evaluate(user: AuthorizationContext, resource: ResourceContext): Promise<PolicyEvaluation>;
}
