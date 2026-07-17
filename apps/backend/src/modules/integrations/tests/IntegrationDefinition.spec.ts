import { describe, it, expect } from "vitest";
import { IntegrationDefinition } from "../domain/models/IntegrationDefinition.js";

describe("IntegrationDefinition", () => {
  const baseConfig = {
    id: "int-1", restaurantId: "rest-1", name: "Test ERP", type: "erp" as const,
    providerId: "prov-1", config: { apiVersion: "v2" }, tags: ["erp", "finance"],
    createdBy: "system",
  };

  it("creates an integration in draft status", () => {
    const def = IntegrationDefinition.create(baseConfig);
    expect(def.status).toBe("draft");
    expect(def.version).toBe(1);
    expect(def.isActive).toBe(true);
  });

  it("transitions to configured state", () => {
    const def = IntegrationDefinition.create(baseConfig);
    const configured = def.configure("adapter-1", [{ type: "data_import", enabled: true }], { endpoint: "/api" });
    expect(configured.status).toBe("configured");
    expect(configured.adapterId).toBe("adapter-1");
    expect(configured.capabilities[0].type).toBe("data_import");
  });

  it("transitions to connected state", () => {
    const def = IntegrationDefinition.create(baseConfig);
    const connected = def.connect();
    expect(connected.status).toBe("connected");
  });

  it("transitions to disconnected state", () => {
    const def = IntegrationDefinition.create(baseConfig).connect();
    const disconnected = def.disconnect();
    expect(disconnected.status).toBe("disconnected");
  });

  it("transitions to failed state with error message", () => {
    const def = IntegrationDefinition.create(baseConfig);
    const failed = def.fail("Connection timeout");
    expect(failed.status).toBe("failed");
    expect(failed.errorMessage).toBe("Connection timeout");
  });

  it("transitions to archived state", () => {
    const def = IntegrationDefinition.create(baseConfig);
    const archived = def.archive();
    expect(archived.status).toBe("archived");
    expect(archived.isActive).toBe(false);
  });

  it("checks capability existence", () => {
    const def = IntegrationDefinition.create(baseConfig);
    const configured = def.configure("adapter-1", [
      { type: "data_import", enabled: true },
      { type: "data_export", enabled: false },
    ], {});
    expect(configured.hasCapability("data_import")).toBe(true);
    expect(configured.hasCapability("data_export")).toBe(false);
    expect(configured.hasCapability("synchronization")).toBe(false);
  });

  it("isRunnable only when connected and active", () => {
    const draft = IntegrationDefinition.create(baseConfig);
    expect(draft.isRunnable()).toBe(false);

    const connected = IntegrationDefinition.reconstitute({
      ...baseConfig, status: "connected", isActive: true,
      capabilities: [], createdAt: new Date(), updatedAt: new Date(),
    });
    expect(connected.isRunnable()).toBe(true);

    const inactive = IntegrationDefinition.reconstitute({
      ...baseConfig, status: "connected", isActive: false,
      capabilities: [], createdAt: new Date(), updatedAt: new Date(),
    });
    expect(inactive.isRunnable()).toBe(false);
  });

  it("increments version on createVersion", () => {
    const def = IntegrationDefinition.create(baseConfig);
    const v2 = def.createVersion();
    expect(v2.version).toBe(2);
  });

  it("marks last run time", () => {
    const def = IntegrationDefinition.create(baseConfig).connect();
    const before = def.lastRunAt;
    const after = def.markRun();
    expect(before).toBeUndefined();
    expect(after.lastRunAt).toBeInstanceOf(Date);
  });

  it("reconstitutes from existing config", () => {
    const now = new Date();
    const def = IntegrationDefinition.reconstitute({
      ...baseConfig, status: "connected", isActive: true,
      capabilities: [{ type: "synchronization", enabled: true }],
      version: 5, errorMessage: "Previous error",
      createdAt: now, updatedAt: now,
    });
    expect(def.status).toBe("connected");
    expect(def.version).toBe(5);
    expect(def.errorMessage).toBe("Previous error");
  });
});
