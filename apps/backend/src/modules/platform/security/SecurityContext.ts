import type { SecurityContext, SecurityRole } from "./types.js";

export class SecurityContextBuilder {
  private context: Partial<SecurityContext> = { metadata: {} };

  static from(context: Partial<SecurityContext>): SecurityContextBuilder {
    const builder = new SecurityContextBuilder();

    builder.context = {
      userId: context.userId ?? "",
      organizationId: context.organizationId ?? "",
      roles: context.roles ?? [],
      permissions: context.permissions ?? [],
      metadata: { ...context.metadata },
      ...(context.restaurantId ? { restaurantId: context.restaurantId } : {}),
      ...(context.tenantId ? { tenantId: context.tenantId } : {}),
      ...(context.sessionId ? { sessionId: context.sessionId } : {}),
      ...(context.requestId ? { requestId: context.requestId } : {}),
      ...(context.correlationId ? { correlationId: context.correlationId } : {}),
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      ...(context.userAgent ? { userAgent: context.userAgent } : {}),
    };

    return builder;
  }

  withUserId(userId: string): SecurityContextBuilder {
    this.context.userId = userId;

    return this;
  }

  withOrganizationId(organizationId: string): SecurityContextBuilder {
    this.context.organizationId = organizationId;

    return this;
  }

  withRole(role: SecurityRole): SecurityContextBuilder {
    this.context.roles = [...(this.context.roles ?? []), role];

    return this;
  }

  withRoles(roles: SecurityRole[]): SecurityContextBuilder {
    this.context.roles = roles;

    return this;
  }

  withPermissions(permissions: string[]): SecurityContextBuilder {
    this.context.permissions = permissions;

    return this;
  }

  withRestaurantId(restaurantId: string): SecurityContextBuilder {
    this.context.restaurantId = restaurantId;

    return this;
  }

  withTenantId(tenantId: string): SecurityContextBuilder {
    this.context.tenantId = tenantId;

    return this;
  }

  withSessionId(sessionId: string): SecurityContextBuilder {
    this.context.sessionId = sessionId;

    return this;
  }

  withRequestId(requestId: string): SecurityContextBuilder {
    this.context.requestId = requestId;

    return this;
  }

  withCorrelationId(correlationId: string): SecurityContextBuilder {
    this.context.correlationId = correlationId;

    return this;
  }

  withIpAddress(ip: string): SecurityContextBuilder {
    this.context.ipAddress = ip;

    return this;
  }

  withUserAgent(userAgent: string): SecurityContextBuilder {
    this.context.userAgent = userAgent;

    return this;
  }

  withMetadata(key: string, value: unknown): SecurityContextBuilder {
    this.context.metadata = { ...this.context.metadata, [key]: value };

    return this;
  }

  build(): SecurityContext {
    return {
      userId: this.context.userId ?? "",
      organizationId: this.context.organizationId ?? "",
      roles: this.context.roles ?? [],
      permissions: this.context.permissions ?? [],
      restaurantId: this.context.restaurantId,
      tenantId: this.context.tenantId,
      sessionId: this.context.sessionId,
      requestId: this.context.requestId,
      correlationId: this.context.correlationId,
      ipAddress: this.context.ipAddress,
      userAgent: this.context.userAgent,
      metadata: this.context.metadata ?? {},
    };
  }
}

export function createSecurityContext(options: {
  userId: string;
  organizationId: string;
  roles?: SecurityRole[];
  permissions?: string[];
  restaurantId?: string;
  tenantId?: string;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}): SecurityContext {
  return new SecurityContextBuilder()
    .withUserId(options.userId)
    .withOrganizationId(options.organizationId)
    .withRoles(options.roles ?? [])
    .withPermissions(options.permissions ?? [])
    .withRestaurantId(options.restaurantId ?? "")
    .withTenantId(options.tenantId ?? "")
    .withSessionId(options.sessionId ?? "")
    .withRequestId(options.requestId ?? "")
    .withCorrelationId(options.correlationId ?? "")
    .withIpAddress(options.ipAddress ?? "")
    .withUserAgent(options.userAgent ?? "")
    .withMetadata("createdAt", new Date().toISOString())
    .build();
}
