import { describe, it, expect } from "vitest";
import { SecurityHeadersProvider, DEFAULT_SECURITY_HEADERS } from "../SecurityHeadersProvider.js";
import type { SecurityHeadersConfig, SecurityHeader } from "../types.js";

describe("SecurityHeadersProvider", () => {
  describe("default configuration", () => {
    it("returns all default headers", () => {
      const provider = new SecurityHeadersProvider();
      const headers = provider.getHeaders();

      expect(headers.length).toBeGreaterThanOrEqual(12);
    });

    it("includes Content-Security-Policy", () => {
      const provider = new SecurityHeadersProvider();
      const headers = provider.getHeaders();

      const csp = headers.find((h) => h.name === "Content-Security-Policy");

      expect(csp).toBeDefined();
      expect(csp!.value).toContain("default-src 'self'");
    });

    it("includes X-Content-Type-Options", () => {
      const provider = new SecurityHeadersProvider();
      const headers = provider.getHeaders();

      expect(headers).toContainEqual({ name: "X-Content-Type-Options", value: "nosniff" });
    });

    it("includes X-Frame-Options", () => {
      const provider = new SecurityHeadersProvider();
      const headers = provider.getHeaders();

      expect(headers).toContainEqual({ name: "X-Frame-Options", value: "DENY" });
    });

    it("includes Strict-Transport-Security", () => {
      const provider = new SecurityHeadersProvider();
      const headers = provider.getHeaders();

      const hsts = headers.find((h) => h.name === "Strict-Transport-Security");

      expect(hsts).toBeDefined();
      expect(hsts!.value).toContain("max-age=31536000");
    });
  });

  describe("custom configuration", () => {
    it("merges custom config with defaults", () => {
      const provider = new SecurityHeadersProvider({
        contentSecurityPolicy: "default-src 'none'",
      });

      const headers = provider.getHeaders();
      const csp = headers.find((h) => h.name === "Content-Security-Policy");

      expect(csp!.value).toBe("default-src 'none'");

      const xcto = headers.find((h) => h.name === "X-Content-Type-Options");

      expect(xcto).toBeDefined();
    });

    it("overrides all defaults when provided", () => {
      const custom: SecurityHeadersConfig = {
        contentSecurityPolicy: "default-src 'self'",
        xContentTypeOptions: "nosniff",
        xFrameOptions: "SAMEORIGIN",
        referrerPolicy: "no-referrer",
        permissionsPolicy: "camera=()",
        crossOriginOpenerPolicy: "unsafe-none",
        crossOriginEmbedderPolicy: "unsafe-none",
        crossOriginResourcePolicy: "cross-origin",
        strictTransportSecurity: "max-age=0",
        xDNSPrefetchControl: "on",
        xDownloadOptions: "noopen",
        xPermittedCrossDomainPolicies: "master-only",
      };

      const provider = new SecurityHeadersProvider(custom);
      const headers = provider.getHeaders();

      expect(headers.find((h) => h.name === "X-Frame-Options")!.value).toBe("SAMEORIGIN");
      expect(headers.find((h) => h.name === "Strict-Transport-Security")!.value).toBe("max-age=0");
    });

    it("omits headers set to null", () => {
      const provider = new SecurityHeadersProvider({
        contentSecurityPolicy: null,
        xFrameOptions: null,
      });

      const headers = provider.getHeaders();

      expect(headers.find((h) => h.name === "Content-Security-Policy")).toBeUndefined();
      expect(headers.find((h) => h.name === "X-Frame-Options")).toBeUndefined();
      expect(headers.find((h) => h.name === "X-Content-Type-Options")).toBeDefined();
    });
  });

  describe("getHeaders with runtime config", () => {
    it("uses runtime config over constructor config", () => {
      const provider = new SecurityHeadersProvider({
        contentSecurityPolicy: "default-src 'self'",
      });

      const headers = provider.getHeaders({
        contentSecurityPolicy: "default-src 'none'",
      });

      const csp = headers.find((h) => h.name === "Content-Security-Policy");

      expect(csp!.value).toBe("default-src 'none'");
    });
  });

  describe("getHeader", () => {
    it("returns a specific header by name", () => {
      const provider = new SecurityHeadersProvider();

      const header = provider.getHeader("X-Content-Type-Options");

      expect(header).toBeDefined();
      expect(header!.value).toBe("nosniff");
    });

    it("is case-insensitive", () => {
      const provider = new SecurityHeadersProvider();

      const header = provider.getHeader("x-content-type-options");

      expect(header).toBeDefined();
    });

    it("returns undefined for unknown header", () => {
      const provider = new SecurityHeadersProvider();

      const header = provider.getHeader("X-Unknown-Header");

      expect(header).toBeUndefined();
    });
  });

  describe("getDefaultConfig", () => {
    it("returns the default config", () => {
      const provider = new SecurityHeadersProvider();
      const config = provider.getDefaultConfig();

      expect(config.contentSecurityPolicy).toBeDefined();
      expect(config.strictTransportSecurity).toBeDefined();
    });

    it("returns a copy that can be mutated without affecting provider", () => {
      const provider = new SecurityHeadersProvider();
      const config = provider.getDefaultConfig();

      config.contentSecurityPolicy = "modified";

      const headers = provider.getHeaders();

      expect(headers.find((h) => h.name === "Content-Security-Policy")!.value).not.toBe("modified");
    });
  });

  describe("DEFAULT_SECURITY_HEADERS", () => {
    it("contains all expected security headers", () => {
      expect(DEFAULT_SECURITY_HEADERS.contentSecurityPolicy).toBeDefined();
      expect(DEFAULT_SECURITY_HEADERS.xContentTypeOptions).toBe("nosniff");
      expect(DEFAULT_SECURITY_HEADERS.xFrameOptions).toBe("DENY");
      expect(DEFAULT_SECURITY_HEADERS.referrerPolicy).toContain("strict-origin");
      expect(DEFAULT_SECURITY_HEADERS.permissionsPolicy).toBeDefined();
      expect(DEFAULT_SECURITY_HEADERS.crossOriginOpenerPolicy).toBe("same-origin");
      expect(DEFAULT_SECURITY_HEADERS.crossOriginEmbedderPolicy).toBe("require-corp");
      expect(DEFAULT_SECURITY_HEADERS.crossOriginResourcePolicy).toBe("same-origin");
      expect(DEFAULT_SECURITY_HEADERS.strictTransportSecurity).toContain("max-age=31536000");
      expect(DEFAULT_SECURITY_HEADERS.xDNSPrefetchControl).toBe("off");
      expect(DEFAULT_SECURITY_HEADERS.xDownloadOptions).toBe("noopen");
      expect(DEFAULT_SECURITY_HEADERS.xPermittedCrossDomainPolicies).toBe("none");
    });
  });
});
