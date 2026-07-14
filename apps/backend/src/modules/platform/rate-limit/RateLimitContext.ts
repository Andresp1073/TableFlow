import type { RateLimitContext } from "./types.js";

export class RateLimitContextBuilder {
  private context: Partial<RateLimitContext> = { metadata: {} };

  static from(context: Partial<RateLimitContext>): RateLimitContextBuilder {
    const builder = new RateLimitContextBuilder();

    builder.context = {
      ...context,
      metadata: { ...(context.metadata ?? {}) },
    };

    return builder;
  }

  withUserId(userId: string): RateLimitContextBuilder {
    this.context.userId = userId;

    return this;
  }

  withRole(role: string): RateLimitContextBuilder {
    this.context.role = role;

    return this;
  }

  withRestaurantId(restaurantId: string): RateLimitContextBuilder {
    this.context.restaurantId = restaurantId;

    return this;
  }

  withTenantId(tenantId: string): RateLimitContextBuilder {
    this.context.tenantId = tenantId;

    return this;
  }

  withApiKey(apiKey: string): RateLimitContextBuilder {
    this.context.apiKey = apiKey;

    return this;
  }

  withIpAddress(ip: string): RateLimitContextBuilder {
    this.context.ipAddress = ip;

    return this;
  }

  withEndpoint(endpoint: string, method?: string): RateLimitContextBuilder {
    this.context.endpoint = endpoint;
    this.context.method = method;

    return this;
  }

  withPolicyName(policyName: string): RateLimitContextBuilder {
    this.context.policyName = policyName;

    return this;
  }

  withMetadata(key: string, value: unknown): RateLimitContextBuilder {
    this.context.metadata = { ...this.context.metadata, [key]: value };

    return this;
  }

  build(): RateLimitContext {
    return {
      userId: this.context.userId,
      role: this.context.role,
      restaurantId: this.context.restaurantId,
      tenantId: this.context.tenantId,
      apiKey: this.context.apiKey,
      ipAddress: this.context.ipAddress,
      endpoint: this.context.endpoint,
      method: this.context.method,
      policyName: this.context.policyName,
      metadata: this.context.metadata ?? {},
    };
  }
}

export function createRateLimitContext(options: {
  userId?: string;
  role?: string;
  restaurantId?: string;
  tenantId?: string;
  apiKey?: string;
  ipAddress?: string;
  endpoint?: string;
  method?: string;
  policyName?: string;
  metadata?: Record<string, unknown>;
}): RateLimitContext {
  return new RateLimitContextBuilder()
    .withUserId(options.userId ?? "")
    .withRole(options.role ?? "")
    .withRestaurantId(options.restaurantId ?? "")
    .withTenantId(options.tenantId ?? "")
    .withApiKey(options.apiKey ?? "")
    .withIpAddress(options.ipAddress ?? "")
    .withEndpoint(options.endpoint ?? "", options.method)
    .withPolicyName(options.policyName ?? "")
    .withMetadata("createdAt", new Date().toISOString())
    .build();
}
