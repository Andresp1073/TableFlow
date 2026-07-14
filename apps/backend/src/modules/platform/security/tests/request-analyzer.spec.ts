import { describe, it, expect } from "vitest";
import { RequestSecurityAnalyzer } from "../RequestSecurityAnalyzer.js";
import type { RequestData } from "../types.js";

function createRequest(overrides: Partial<RequestData> = {}): RequestData {
  return {
    method: "GET",
    path: "/api/reservations",
    headers: {
      "host": "example.com",
      "user-agent": "test-agent",
      "content-type": "application/json",
    },
    contentType: "application/json",
    ...overrides,
  };
}

describe("RequestSecurityAnalyzer", () => {
  it("passes for a normal GET request", async () => {
    const analyzer = new RequestSecurityAnalyzer();

    const result = await analyzer.analyze(createRequest());

    expect(result.passed).toBe(true);
    expect(result.threats).toHaveLength(0);
  });

  it("detects unexpected HTTP methods", async () => {
    const analyzer = new RequestSecurityAnalyzer();

    const result = await analyzer.analyze(createRequest({ method: "INVALID" }));

    expect(result.passed).toBe(false);
    expect(result.threats[0]?.type).toBe("unexpected_method");
  });

  it("detects TRACE method as suspicious", async () => {
    const analyzer = new RequestSecurityAnalyzer();

    const result = await analyzer.analyze(createRequest({ method: "TRACE" }));

    expect(result.passed).toBe(false);
    expect(result.threats[0]?.type).toBe("unexpected_method");
  });

  it("detects missing Content-Type on POST", async () => {
    const analyzer = new RequestSecurityAnalyzer();

    const result = await analyzer.analyze(createRequest({
      method: "POST",
      contentType: undefined,
      headers: { "host": "example.com", "user-agent": "test" },
    }));

    expect(result.passed).toBe(false);
    expect(result.threats.some((t) => t.type === "invalid_content_type")).toBe(true);
  });

  it("detects invalid Content-Type", async () => {
    const analyzer = new RequestSecurityAnalyzer();

    const result = await analyzer.analyze(createRequest({
      method: "POST",
      contentType: "application/evil",
    }));

    expect(result.passed).toBe(false);
    expect(result.threats.some((t) => t.type === "invalid_content_type")).toBe(true);
  });

  it("detects oversized payloads", async () => {
    const analyzer = new RequestSecurityAnalyzer(100);

    const result = await analyzer.analyze(createRequest({
      method: "POST",
      contentLength: 200,
    }));

    expect(result.passed).toBe(false);
    expect(result.threats.some((t) => t.type === "oversized_payload")).toBe(true);
  });

  it("detects missing required headers", async () => {
    const analyzer = new RequestSecurityAnalyzer();

    const result = await analyzer.analyze(createRequest({
      headers: {},
      contentType: undefined,
    }));

    expect(result.passed).toBe(false);
    expect(result.threats.some((t) => t.type === "missing_header")).toBe(true);
  });

  it("detects SQL injection in query parameters", async () => {
    const analyzer = new RequestSecurityAnalyzer();

    const result = await analyzer.analyze(createRequest({
      method: "GET",
      query: { id: "1' OR '1'='1" },
    }));

    expect(result.passed).toBe(false);
    expect(result.threats.some((t) => t.type === "sql_injection_attempt")).toBe(true);
  });

  it("detects XSS in body", async () => {
    const analyzer = new RequestSecurityAnalyzer();

    const result = await analyzer.analyze(createRequest({
      method: "POST",
      body: "<script>alert(1)</script>",
    }));

    expect(result.passed).toBe(false);
    expect(result.threats.some((t) => t.type === "xss_attempt")).toBe(true);
  });

  it("detects path traversal in query", async () => {
    const analyzer = new RequestSecurityAnalyzer();

    const result = await analyzer.analyze(createRequest({
      query: { file: "../../../etc/passwd" },
    }));

    expect(result.passed).toBe(false);
    expect(result.threats.some((t) => t.type === "path_traversal_attempt")).toBe(true);
  });

  it("detects SQL injection in nested body object", async () => {
    const analyzer = new RequestSecurityAnalyzer();

    const result = await analyzer.analyze(createRequest({
      method: "POST",
      body: {
        user: {
          name: "test",
          comment: "1'; DROP TABLE users; --",
        },
      },
    }));

    expect(result.passed).toBe(false);
    expect(result.threats.some((t) => t.type === "sql_injection_attempt")).toBe(true);
  });

  it("detects multiple threats", async () => {
    const analyzer = new RequestSecurityAnalyzer(50);

    const result = await analyzer.analyze(createRequest({
      method: "INVALID",
      contentType: undefined,
      contentLength: 100,
      headers: {},
    }));

    expect(result.passed).toBe(false);
    expect(result.threats.length).toBeGreaterThanOrEqual(3);
  });

  it("detects internal IP address", async () => {
    const analyzer = new RequestSecurityAnalyzer();

    const result = await analyzer.analyze(createRequest({
      ip: "192.168.1.1",
    }));

    expect(result.passed).toBe(false);
    expect(result.threats.some((t) => t.type === "suspicious_pattern")).toBe(true);
  });
});
