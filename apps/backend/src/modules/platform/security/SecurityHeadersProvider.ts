import type {
  SecurityHeadersProvider as SecurityHeadersProviderInterface,
  SecurityHeadersConfig,
  SecurityHeader,
} from "./types.js";

export const DEFAULT_SECURITY_HEADERS: SecurityHeadersConfig = {
  contentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'",
  xContentTypeOptions: "nosniff",
  xFrameOptions: "DENY",
  referrerPolicy: "strict-origin-when-cross-origin",
  permissionsPolicy: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  crossOriginOpenerPolicy: "same-origin",
  crossOriginEmbedderPolicy: "require-corp",
  crossOriginResourcePolicy: "same-origin",
  strictTransportSecurity: "max-age=31536000; includeSubDomains",
  xDNSPrefetchControl: "off",
  xDownloadOptions: "noopen",
  xPermittedCrossDomainPolicies: "none",
};

export class SecurityHeadersProvider implements SecurityHeadersProviderInterface {
  private readonly defaultConfig: SecurityHeadersConfig;

  constructor(config?: Partial<SecurityHeadersConfig>) {
    this.defaultConfig = { ...DEFAULT_SECURITY_HEADERS, ...config };
  }

  getHeaders(config?: SecurityHeadersConfig): SecurityHeader[] {
    const merged = { ...this.defaultConfig, ...config };
    const headers: SecurityHeader[] = [];

    this.addIfDefined(headers, "Content-Security-Policy", merged.contentSecurityPolicy);
    this.addIfDefined(headers, "X-Content-Type-Options", merged.xContentTypeOptions);
    this.addIfDefined(headers, "X-Frame-Options", merged.xFrameOptions);
    this.addIfDefined(headers, "Referrer-Policy", merged.referrerPolicy);
    this.addIfDefined(headers, "Permissions-Policy", merged.permissionsPolicy);
    this.addIfDefined(headers, "Cross-Origin-Opener-Policy", merged.crossOriginOpenerPolicy);
    this.addIfDefined(headers, "Cross-Origin-Embedder-Policy", merged.crossOriginEmbedderPolicy);
    this.addIfDefined(headers, "Cross-Origin-Resource-Policy", merged.crossOriginResourcePolicy);
    this.addIfDefined(headers, "Strict-Transport-Security", merged.strictTransportSecurity);
    this.addIfDefined(headers, "X-DNS-Prefetch-Control", merged.xDNSPrefetchControl);
    this.addIfDefined(headers, "X-Download-Options", merged.xDownloadOptions);
    this.addIfDefined(headers, "X-Permitted-Cross-Domain-Policies", merged.xPermittedCrossDomainPolicies);

    return headers;
  }

  getHeader(name: string): SecurityHeader | undefined {
    const headers = this.getHeaders();

    return headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  }

  getDefaultConfig(): SecurityHeadersConfig {
    return { ...this.defaultConfig };
  }

  private addIfDefined(headers: SecurityHeader[], name: string, value: string | null | undefined): void {
    if (value !== null && value !== undefined) {
      headers.push({ name, value });
    }
  }
}
