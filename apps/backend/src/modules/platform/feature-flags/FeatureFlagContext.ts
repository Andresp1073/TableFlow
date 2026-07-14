import type { FeatureFlagContext } from "./types.js";

export function createFeatureFlagContext(
  overrides?: Partial<FeatureFlagContext>,
): FeatureFlagContext {
  return {
    environment: overrides?.environment ?? process.env["NODE_ENV"] ?? "development",
    tenantId: overrides?.tenantId,
    restaurantId: overrides?.restaurantId,
    userId: overrides?.userId,
    roles: overrides?.roles,
    permissions: overrides?.permissions,
    apiClientId: overrides?.apiClientId,
    requestMetadata: overrides?.requestMetadata,
    evaluatedAt: new Date(),
  };
}

export function mergeContext(
  base: FeatureFlagContext,
  overrides?: Partial<FeatureFlagContext>,
): FeatureFlagContext {
  return {
    ...base,
    ...overrides,
    evaluatedAt: new Date(),
    roles: overrides?.roles ?? base.roles,
    permissions: overrides?.permissions ?? base.permissions,
    requestMetadata: {
      ...base.requestMetadata,
      ...overrides?.requestMetadata,
    },
  };
}
