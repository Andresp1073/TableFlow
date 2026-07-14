import { describe, it, expect } from "vitest";
import { ThreatAnalyzer } from "../ThreatAnalyzer.js";
import { createProtectionContext } from "../ProtectionContext.js";

describe("ThreatAnalyzer", () => {
  const analyzer = new ThreatAnalyzer();

  it("returns no threats for clean request", async () => {
    const ctx = createProtectionContext({
      requestId: "1",
      method: "GET",
      path: "/api/reservations",
      query: { limit: "10" },
    });

    const result = await analyzer.analyze(ctx);

    expect(result.threats).toHaveLength(0);
    expect(result.riskScore).toBe(0);
  });

  it("detects SQL injection in query", async () => {
    const ctx = createProtectionContext({
      requestId: "2",
      method: "GET",
      path: "/api/reservations",
      query: { id: "1' OR '1'='1" },
    });

    const result = await analyzer.analyze(ctx);

    expect(result.threats.length).toBeGreaterThan(0);
    expect(result.threats[0].category).toBe("sql_injection");
    expect(result.threats[0].severity).toBe("critical");
    expect(result.riskScore).toBeGreaterThan(0);
  });

  it("detects SQL injection in body string", async () => {
    const ctx = createProtectionContext({
      requestId: "3",
      method: "POST",
      path: "/api/reservations",
      body: "username = admin' --",
    });

    const result = await analyzer.analyze(ctx);

    expect(result.threats.length).toBeGreaterThan(0);
    expect(result.threats[0].category).toBe("sql_injection");
  });

  it("detects XSS in query", async () => {
    const ctx = createProtectionContext({
      requestId: "4",
      method: "GET",
      path: "/search",
      query: { q: "<img src=x onerror=alert(1)>" },
    });

    const result = await analyzer.analyze(ctx);

    expect(result.threats.length).toBeGreaterThan(0);
    expect(result.threats.some((t) => t.category === "xss")).toBe(true);
  });

  it("detects path traversal in path", async () => {
    const ctx = createProtectionContext({
      requestId: "5",
      method: "GET",
      path: "/../../../etc/passwd",
    });

    const result = await analyzer.analyze(ctx);

    expect(result.threats.length).toBeGreaterThan(0);
    expect(result.threats[0].category).toBe("path_traversal");
  });

  it("detects XSS in nested body object", async () => {
    const ctx = createProtectionContext({
      requestId: "6",
      method: "POST",
      path: "/api/data",
      body: {
        user: {
          name: "John",
          bio: "<script>alert(1)</script>",
        },
      },
    });

    const result = await analyzer.analyze(ctx);

    expect(result.threats.length).toBeGreaterThan(0);
    expect(result.threats[0].category).toBe("xss");
  });

  it("detects path traversal in body field", async () => {
    const ctx = createProtectionContext({
      requestId: "7",
      method: "POST",
      path: "/api/upload",
      body: { filename: "../../../etc/shadow" },
    });

    const result = await analyzer.analyze(ctx);

    expect(result.threats.length).toBeGreaterThan(0);
    expect(result.threats[0].category).toBe("path_traversal");
  });

  it("detects suspicious query parameter names", async () => {
    const ctx = createProtectionContext({
      requestId: "8",
      method: "GET",
      path: "/api/data",
      query: { __proto__: "1", admin: "true" },
    });

    const result = await analyzer.analyze(ctx);

    const suspiciousParams = result.threats.filter((t) => t.category === "request_anomaly");

    expect(suspiciousParams.length).toBeGreaterThan(0);
  });

  it("detects body without content type as anomaly", async () => {
    const ctx = createProtectionContext({
      requestId: "9",
      method: "POST",
      path: "/api/data",
      body: "some data",
      contentLength: 9,
    });

    const result = await analyzer.analyze(ctx);

    const anomalies = result.threats.filter((t) => t.category === "request_anomaly");

    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].message).toContain("body but no Content-Type");
  });

  it("detects threats in array body elements", async () => {
    const ctx = createProtectionContext({
      requestId: "10",
      method: "POST",
      path: "/api/batch",
      body: {
        items: [
          { name: "safe" },
          { query: "DROP TABLE users" },
        ],
      },
    });

    const result = await analyzer.analyze(ctx);

    expect(result.threats.length).toBeGreaterThan(0);
  });

  it("calculates risk score based on threats", async () => {
    const ctx = createProtectionContext({
      requestId: "11",
      method: "GET",
      path: "/",
      query: { q: "<script>alert(1)</script>; DROP TABLE users; ../../../etc/passwd" },
    });

    const result = await analyzer.analyze(ctx);

    expect(result.riskScore).toBeGreaterThan(0);
    expect(result.riskScore).toBeLessThanOrEqual(100);
  });

  it("detects XSS in array query values", async () => {
    const ctx = createProtectionContext({
      requestId: "12",
      method: "GET",
      path: "/search",
      query: { tags: ["safe", "<img onerror=alert(1) src=x>"] },
    });

    const result = await analyzer.analyze(ctx);

    expect(result.threats.some((t) => t.category === "xss")).toBe(true);
  });

  it("returns empty analysis for null body", async () => {
    const ctx = createProtectionContext({
      requestId: "13",
      method: "GET",
      path: "/health",
      body: null,
    });

    const result = await analyzer.analyze(ctx);

    expect(result.threats).toHaveLength(0);
  });
});
