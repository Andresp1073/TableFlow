import { describe, it, expect } from "vitest";
import { HeaderValidationRule } from "../rules/HeaderValidationRule.js";
import { ContentTypeValidationRule } from "../rules/ContentTypeValidationRule.js";
import { PayloadSizeValidationRule } from "../rules/PayloadSizeValidationRule.js";
import { HttpMethodValidationRule } from "../rules/HttpMethodValidationRule.js";
import { OriginValidationRule } from "../rules/OriginValidationRule.js";
import { UserAgentValidationRule } from "../rules/UserAgentValidationRule.js";
import { createProtectionContext } from "../ProtectionContext.js";

describe("HeaderValidationRule", () => {
  const rule = new HeaderValidationRule();

  it("allows request with valid headers", async () => {
    const ctx = createProtectionContext({
      requestId: "1",
      headers: { host: "example.com", "content-type": "application/json" },
    });

    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("allow");
  });

  it("rejects request missing required Host header", async () => {
    const ctx = createProtectionContext({
      requestId: "2",
      headers: { "content-type": "application/json" },
    });

    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("reject");
    expect(result.reason).toContain("Missing required header");
  });

  it("rejects request with forbidden header", async () => {
    const ctx = createProtectionContext({
      requestId: "3",
      headers: { host: "example.com", "x-forwarded-for": "10.0.0.1" },
    });

    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("reject");
    expect(result.threatCategory).toBe("header_injection");
  });

  it("rejects request with suspicious header value (newline)", async () => {
    const ctx = createProtectionContext({
      requestId: "4",
      headers: { host: "example.com", "x-custom": "value\nInjected" },
    });

    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("reject");
    expect(result.threatCategory).toBe("header_injection");
  });

  it("rejects request with too many headers", async () => {
    const headers: Record<string, string> = { host: "example.com" };

    for (let i = 0; i < 60; i++) {
      headers[`x-extra-${i}`] = `value${i}`;
    }

    const ctx = createProtectionContext({ requestId: "5", headers });

    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("reject");
    expect(result.reason).toContain("Too many headers");
  });

  it("skips when no headers present but not required", async () => {
    const customRule = new HeaderValidationRule(10, [], []);
    const ctx = createProtectionContext({ requestId: "6", headers: { "x-custom": "val" } });
    const result = await customRule.evaluate(ctx);

    expect(result.action).toBe("allow");
  });
});

describe("ContentTypeValidationRule", () => {
  const rule = new ContentTypeValidationRule();

  it("allows valid content type", async () => {
    const ctx = createProtectionContext({
      requestId: "1",
      method: "POST",
      contentType: "application/json",
    });

    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("allow");
  });

  it("warns when mutation request has no content type", async () => {
    const ctx = createProtectionContext({
      requestId: "2",
      method: "POST",
      contentType: "",
    });

    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("warn");
    expect(result.threatCategory).toBe("invalid_content_type");
  });

  it("rejects forbidden content type", async () => {
    const ctx = createProtectionContext({
      requestId: "3",
      method: "POST",
      contentType: "application/x-sh",
    });

    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("reject");
    expect(result.threatCategory).toBe("invalid_content_type");
  });

  it("warns on unrecognized content type", async () => {
    const ctx = createProtectionContext({
      requestId: "4",
      contentType: "application/vnd.custom+json",
    });

    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("warn");
  });

  it("skips GET request with no content type", async () => {
    const ctx = createProtectionContext({
      requestId: "5",
      method: "GET",
      contentType: "",
    });

    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("continue");
  });

  it("accepts multipart form data", async () => {
    const ctx = createProtectionContext({
      requestId: "6",
      contentType: "multipart/form-data; boundary=---123",
    });

    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("allow");
  });
});

describe("PayloadSizeValidationRule", () => {
  const rule = new PayloadSizeValidationRule();

  it("allows valid payload size", async () => {
    const ctx = createProtectionContext({
      requestId: "1",
      contentLength: 1024,
    });

    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("allow");
  });

  it("rejects oversized payload", async () => {
    const ctx = createProtectionContext({
      requestId: "2",
      contentLength: 20 * 1024 * 1024,
    });

    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("reject");
    expect(result.threatCategory).toBe("oversized_payload");
  });

  it("skips when no content length", async () => {
    const ctx = createProtectionContext({ requestId: "3" });

    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("continue");
  });

  it("rejects too-small payload with min bytes", async () => {
    const strict = new PayloadSizeValidationRule(30, 10 * 1024 * 1024, 100);
    const ctx = createProtectionContext({ requestId: "4", contentLength: 10 });

    const result = await strict.evaluate(ctx);

    expect(result.action).toBe("reject");
    expect(result.reason).toContain("too small");
  });
});

describe("HttpMethodValidationRule", () => {
  const rule = new HttpMethodValidationRule();

  it("allows GET", async () => {
    const ctx = createProtectionContext({ requestId: "1", method: "GET" });
    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("allow");
  });

  it("allows POST", async () => {
    const ctx = createProtectionContext({ requestId: "2", method: "POST" });
    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("allow");
  });

  it("rejects TRACE", async () => {
    const ctx = createProtectionContext({ requestId: "3", method: "TRACE" });
    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("reject");
    expect(result.threatCategory).toBe("unexpected_method");
  });

  it("rejects CONNECT", async () => {
    const ctx = createProtectionContext({ requestId: "4", method: "CONNECT" });
    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("reject");
  });

  it("rejects invalid method", async () => {
    const ctx = createProtectionContext({ requestId: "5", method: "FOOBAR" });
    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("reject");
  });

  it("handles lowercase methods", async () => {
    const ctx = createProtectionContext({ requestId: "6", method: "post" });
    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("allow");
  });
});

describe("OriginValidationRule", () => {
  const rule = new OriginValidationRule();

  it("allows request with no origin when not strict", async () => {
    const ctx = createProtectionContext({ requestId: "1" });
    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("continue");
  });

  it("warns on missing origin in strict mode", async () => {
    const strict = new OriginValidationRule(50, [], [], ["https", "http"], true);
    const ctx = createProtectionContext({ requestId: "2" });
    const result = await strict.evaluate(ctx);

    expect(result.action).toBe("warn");
  });

  it("allows whitelisted origin", async () => {
    const whitelist = new OriginValidationRule(50, ["https://app.example.com"]);
    const ctx = createProtectionContext({ requestId: "3", origin: "https://app.example.com" });
    const result = await whitelist.evaluate(ctx);

    expect(result.action).toBe("allow");
  });

  it("rejects non-whitelisted origin", async () => {
    const whitelist = new OriginValidationRule(50, ["https://app.example.com"]);
    const ctx = createProtectionContext({ requestId: "4", origin: "https://evil.com" });
    const result = await whitelist.evaluate(ctx);

    expect(result.action).toBe("reject");
    expect(result.threatCategory).toBe("suspicious_origin");
  });

  it("rejects malformed origin URL", async () => {
    const ctx = createProtectionContext({ requestId: "5", origin: ":::invalid" });
    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("reject");
    expect(result.threatCategory).toBe("malformed_request");
  });

  it("warns on suspicious TLD", async () => {
    const ctx = createProtectionContext({ requestId: "6", origin: "https://malware.xyz" });
    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("warn");
    expect(result.threatCategory).toBe("suspicious_origin");
  });

  it("supports wildcard origin matching", async () => {
    const whitelist = new OriginValidationRule(50, ["https://*.example.com"]);
    const ctx = createProtectionContext({ requestId: "7", origin: "https://app.example.com" });
    const result = await whitelist.evaluate(ctx);

    expect(result.action).toBe("allow");
  });
});

describe("UserAgentValidationRule", () => {
  it("warns on missing User-Agent", async () => {
    const rule = new UserAgentValidationRule();
    const ctx = createProtectionContext({ requestId: "1" });
    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("warn");
  });

  it("rejects missing User-Agent when blockBlank is set", async () => {
    const rule = new UserAgentValidationRule(60, [], [], true);
    const ctx = createProtectionContext({ requestId: "2" });
    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("reject");
  });

  it("allows normal browser User-Agent", async () => {
    const rule = new UserAgentValidationRule();
    const ctx = createProtectionContext({
      requestId: "3",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    });

    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("allow");
  });

  it("allows known malicious User-Agent when not blocked", async () => {
    const rule = new UserAgentValidationRule();
    const ctx = createProtectionContext({ requestId: "4", userAgent: "curl/7.68.0" });
    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("allow");
  });

  it("rejects known malicious User-Agent when blocked", async () => {
    const rule = new UserAgentValidationRule(60, undefined, undefined, false, true);
    const ctx = createProtectionContext({ requestId: "5", userAgent: "sqlmap/1.5" });
    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("reject");
    expect(result.threatCategory).toBe("malicious_user_agent");
  });

  it("warns on suspicious blank UA value", async () => {
    const rule = new UserAgentValidationRule();
    const ctx = createProtectionContext({ requestId: "6", userAgent: "null" });
    const result = await rule.evaluate(ctx);

    expect(result.action).toBe("warn");
  });
});
