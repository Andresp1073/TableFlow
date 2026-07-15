import { describe, it, expect } from "vitest";
import { ServiceDefinition } from "../ServiceDefinition.js";
import { OrchestrationValidationError } from "../errors.js";

describe("ServiceDefinition", () => {
  it("creates an internal service", () => {
    const svc = ServiceDefinition.createClusterIP("backend", 4000, { app: "backend" });
    expect(svc.name).toBe("backend");
    expect(svc.type).toBe("internal");
    expect(svc.ports).toHaveLength(1);
    expect(svc.ports[0]!.port).toBe(4000);
  });

  it("creates a load balanced service", () => {
    const svc = ServiceDefinition.createLoadBalancer("frontend", 3000, { app: "frontend" });
    expect(svc.type).toBe("load_balanced");
    expect(svc.isLoadBalanced()).toBe(true);
  });

  it("creates a headless service", () => {
    const svc = ServiceDefinition.createHeadless("stateful", 8080, { app: "stateful" });
    expect(svc.type).toBe("headless");
    expect(svc.clusterIP).toBe("None");
    expect(svc.isHeadless()).toBe(true);
  });

  it("creates an external service", () => {
    const svc = new ServiceDefinition({
      name: "external-db",
      type: "external",
      ports: [{ name: "mysql", port: 3306, protocol: "TCP" }],
      selector: {},
      externalName: "db.example.com",
    });

    expect(svc.type).toBe("external");
    expect(svc.externalName).toBe("db.example.com");
    expect(svc.isExternal()).toBe(true);
  });

  it("throws on empty name", () => {
    expect(() =>
      new ServiceDefinition({ name: "", type: "internal", ports: [{ name: "http", port: 80, protocol: "TCP" }], selector: {} }),
    ).toThrow(OrchestrationValidationError);
  });

  it("throws on invalid type", () => {
    expect(() =>
      new ServiceDefinition({ name: "test", type: "invalid" as never, ports: [{ name: "http", port: 80, protocol: "TCP" }], selector: {} }),
    ).toThrow(OrchestrationValidationError);
  });

  it("throws on empty ports", () => {
    expect(() =>
      new ServiceDefinition({ name: "test", type: "internal", ports: [], selector: {} }),
    ).toThrow(OrchestrationValidationError);
  });

  it("throws on invalid port number", () => {
    expect(() =>
      new ServiceDefinition({ name: "test", type: "internal", ports: [{ name: "bad", port: 99999, protocol: "TCP" }], selector: {} }),
    ).toThrow(OrchestrationValidationError);
  });

  it("throws on duplicate port names", () => {
    expect(() =>
      new ServiceDefinition({ name: "test", type: "internal", ports: [{ name: "http", port: 80, protocol: "TCP" }, { name: "http", port: 443, protocol: "TCP" }], selector: {} }),
    ).toThrow(OrchestrationValidationError);
  });

  it("throws on external service without externalName", () => {
    expect(() =>
      new ServiceDefinition({ name: "test", type: "external", ports: [{ name: "http", port: 80, protocol: "TCP" }], selector: {} }),
    ).toThrow(OrchestrationValidationError);
  });

  it("finds a port by name", () => {
    const svc = new ServiceDefinition({
      name: "test",
      type: "internal",
      ports: [
        { name: "http", port: 80, protocol: "TCP" },
        { name: "metrics", port: 9090, protocol: "TCP" },
      ],
      selector: { app: "test" },
    });

    expect(svc.getPort("http")?.port).toBe(80);
    expect(svc.getPort("metrics")?.port).toBe(9090);
    expect(svc.getPort("unknown")).toBeUndefined();
  });

  it("gets target port", () => {
    const svc = new ServiceDefinition({
      name: "test",
      type: "internal",
      ports: [{ name: "http", port: 80, targetPort: 8080, protocol: "TCP" }],
      selector: { app: "test" },
    });

    expect(svc.getTargetPort("http")).toBe(8080);
  });
});
