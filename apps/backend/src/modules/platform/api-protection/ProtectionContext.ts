import type { ProtectionContext, SecurityContext } from "./types.js";

export class ProtectionContextBuilder {
  private context: Partial<ProtectionContext> = { metadata: {} };

  static from(context: Partial<ProtectionContext>): ProtectionContextBuilder {
    const builder = new ProtectionContextBuilder();

    builder.context = {
      requestId: context.requestId ?? "",
      method: context.method ?? "GET",
      path: context.path ?? "/",
      headers: { ...(context.headers ?? {}) },
      query: { ...(context.query ?? {}) },
      body: context.body,
      contentType: context.contentType,
      contentLength: context.contentLength,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      origin: context.origin,
      referer: context.referer,
      securityContext: context.securityContext,
      timestamp: context.timestamp ?? new Date(),
      metadata: { ...(context.metadata ?? {}) },
    };

    return builder;
  }

  withRequestId(requestId: string): ProtectionContextBuilder {
    this.context.requestId = requestId;

    return this;
  }

  withMethod(method: string): ProtectionContextBuilder {
    this.context.method = method;

    return this;
  }

  withPath(path: string): ProtectionContextBuilder {
    this.context.path = path;

    return this;
  }

  withHeader(name: string, value: string | string[] | undefined): ProtectionContextBuilder {
    this.context.headers = { ...this.context.headers, [name]: value };

    return this;
  }

  withHeaders(headers: Record<string, string | string[] | undefined>): ProtectionContextBuilder {
    this.context.headers = { ...this.context.headers, ...headers };

    return this;
  }

  withQuery(query: Record<string, string | string[] | undefined>): ProtectionContextBuilder {
    this.context.query = query;

    return this;
  }

  withBody(body: unknown): ProtectionContextBuilder {
    this.context.body = body;

    return this;
  }

  withContentType(contentType: string): ProtectionContextBuilder {
    this.context.contentType = contentType;

    return this;
  }

  withContentLength(length?: number): ProtectionContextBuilder {
    this.context.contentLength = length;

    return this;
  }

  withIpAddress(ip: string): ProtectionContextBuilder {
    this.context.ipAddress = ip;

    return this;
  }

  withUserAgent(userAgent: string): ProtectionContextBuilder {
    this.context.userAgent = userAgent;

    return this;
  }

  withOrigin(origin: string): ProtectionContextBuilder {
    this.context.origin = origin;

    return this;
  }

  withReferer(referer: string): ProtectionContextBuilder {
    this.context.referer = referer;

    return this;
  }

  withSecurityContext(securityContext: SecurityContext): ProtectionContextBuilder {
    this.context.securityContext = securityContext;

    return this;
  }

  withMetadata(key: string, value: unknown): ProtectionContextBuilder {
    this.context.metadata = { ...this.context.metadata, [key]: value };

    return this;
  }

  build(): ProtectionContext {
    return {
      requestId: this.context.requestId ?? "",
      method: this.context.method ?? "GET",
      path: this.context.path ?? "/",
      headers: this.context.headers ?? {},
      query: this.context.query ?? {},
      body: this.context.body,
      contentType: this.context.contentType,
      contentLength: this.context.contentLength,
      ipAddress: this.context.ipAddress,
      userAgent: this.context.userAgent,
      origin: this.context.origin,
      referer: this.context.referer,
      securityContext: this.context.securityContext,
      timestamp: this.context.timestamp ?? new Date(),
      metadata: this.context.metadata ?? {},
    };
  }
}

export function createProtectionContext(options: {
  requestId?: string;
  method?: string;
  path?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
  contentType?: string;
  contentLength?: number;
  ipAddress?: string;
  userAgent?: string;
  origin?: string;
  referer?: string;
  securityContext?: SecurityContext;
  metadata?: Record<string, unknown>;
}): ProtectionContext {
  return new ProtectionContextBuilder()
    .withRequestId(options.requestId ?? `req_${Date.now()}`)
    .withMethod(options.method ?? "GET")
    .withPath(options.path ?? "/")
    .withHeaders(options.headers ?? {})
    .withQuery(options.query ?? {})
    .withBody(options.body)
    .withContentType(options.contentType ?? "")
    .withContentLength(options.contentLength)
    .withIpAddress(options.ipAddress ?? "")
    .withUserAgent(options.userAgent ?? "")
    .withOrigin(options.origin ?? "")
    .withReferer(options.referer ?? "")
    .withSecurityContext(options.securityContext as SecurityContext)
    .withMetadata("createdAt", new Date().toISOString())
    .build();
}
