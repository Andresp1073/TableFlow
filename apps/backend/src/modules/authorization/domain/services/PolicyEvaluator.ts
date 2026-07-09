import type { AuthorizationContext } from "../models/AuthorizationContext.js";
import type { ResourceContext } from "../models/ResourceContext.js";
import type { AuthorizationPolicy, PolicyEvaluation } from "./AuthorizationPolicy.js";

export interface PolicyEvaluator {
  evaluate(
    user: AuthorizationContext,
    resource: ResourceContext,
    policies: AuthorizationPolicy[]
  ): Promise<PolicyEvaluation>;

  evaluateAll(
    user: AuthorizationContext,
    resource: ResourceContext,
    policies: AuthorizationPolicy[]
  ): Promise<PolicyEvaluation[]>;
}
