import type { RateLimitKeyResolver as RateLimitKeyResolverInterface, RateLimitContext, LimitDimension } from "./types.js";

export class RateLimitKeyResolver implements RateLimitKeyResolverInterface {
  resolve(context: RateLimitContext, dimensions: LimitDimension[]): string {
    const parts: string[] = ["ratelimit"];

    for (const dim of dimensions) {
      const value = this.getDimensionValue(context, dim);

      if (value) {
        parts.push(`${dim}:${value}`);
      }
    }

    if (parts.length === 1) {
      parts.push("global");
    }

    return parts.join(":");
  }

  resolveWithPolicy(context: RateLimitContext, policyName: string, dimensions: LimitDimension[]): string {
    const parts: string[] = ["ratelimit", `policy:${policyName}`];

    for (const dim of dimensions) {
      const value = this.getDimensionValue(context, dim);

      if (value) {
        parts.push(`${dim}:${value}`);
      }
    }

    return parts.join(":");
  }

  private getDimensionValue(context: RateLimitContext, dimension: LimitDimension): string | undefined {
    switch (dimension) {
      case "user": {
        return context.userId;
      }
      case "role": {
        return context.role;
      }
      case "restaurant": {
        return context.restaurantId;
      }
      case "tenant": {
        return context.tenantId;
      }
      case "api_key": {
        return context.apiKey;
      }
      case "ip": {
        return context.ipAddress;
      }
      case "endpoint": {
        return context.endpoint ? `${context.method ?? "ANY"}:${context.endpoint}` : undefined;
      }
      default: {
        return undefined;
      }
    }
  }
}
