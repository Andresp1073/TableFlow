import type { AuthorizationContext } from "../models/AuthorizationContext.js";
import type { ResourceContext } from "../models/ResourceContext.js";
import type { PolicyEvaluation } from "./AuthorizationPolicy.js";

export interface ResourceAuthorizationService {
  canAccessRestaurant(user: AuthorizationContext, restaurantId: string): Promise<boolean>;

  canModifyReservation(user: AuthorizationContext, resource: ResourceContext): Promise<boolean>;

  canManageEmployee(user: AuthorizationContext, resource: ResourceContext): Promise<boolean>;

  canAccessUser(user: AuthorizationContext, resource: ResourceContext): Promise<boolean>;

  evaluatePolicy(user: AuthorizationContext, resource: ResourceContext, ...policyNames: string[]): Promise<PolicyEvaluation>;
}
