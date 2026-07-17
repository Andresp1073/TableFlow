import { describe, it, expect, beforeEach } from "vitest";
import { IntegrationOrchestrator } from "../domain/services/IntegrationOrchestrator.js";
import { InMemoryIntegrationDefinitionRepository, InMemoryIntegrationContextRepository, InMemoryConnectionProfileRepository } from "../infrastructure/repositories/InMemoryIntegrationRepositories.js";
import { IntegrationDefinition } from "../domain/models/IntegrationDefinition.js";
import { ConnectionProfile } from "../domain/models/ConnectionProfile.js";

describe("IntegrationOrchestrator", () => {
  let defRepo: InMemoryIntegrationDefinitionRepository;
  let ctxRepo: InMemoryIntegrationContextRepository;
  let profileRepo: InMemoryConnectionProfileRepository;
  let orchestrator: IntegrationOrchestrator;
  let definition: IntegrationDefinition;
  let profile: ConnectionProfile;

  beforeEach(async () => {
    defRepo = new InMemoryIntegrationDefinitionRepository();
    ctxRepo = new InMemoryIntegrationContextRepository();
    profileRepo = new InMemoryConnectionProfileRepository();
    orchestrator = new IntegrationOrchestrator(defRepo, ctxRepo, profileRepo);

    definition = IntegrationDefinition.create({
      id: "int-1", restaurantId: "rest-1", name: "Test ERP",
      type: "erp", providerId: "prov-1", config: {}, tags: [],
      createdBy: "system",
    });
    const configured = definition.configure("adapter-1", [{ type: "data_import", enabled: true }], {});
    profile = ConnectionProfile.create({
      id: "conn-1", integrationId: "int-1", restaurantId: "rest-1",
      name: "Main", authType: "api_key", credentialsRef: "secret/key",
      maxRetries: 3,
    });

    await defRepo.save(configured.connect());
    await profileRepo.save(profile.connect());
  });

  it("registers default adapters", () => {
    const types = orchestrator.listAdapters();
    expect(types).toContain("erp");
    expect(types).toContain("crm");
    expect(types).toContain("pos");
    expect(types).toContain("accounting");
    expect(types).toContain("payments");
    expect(types).toContain("marketing");
    expect(types).toContain("messaging");
    expect(types).toContain("analytics");
    expect(types).toContain("identity");
    expect(types).toContain("custom");
    expect(types.length).toBe(10);
  });

  it("executes an integration and returns completed context", async () => {
    const context = await orchestrator.execute(definition, "data_import", { items: [] });
    expect(context.status).toBe("completed");
    expect(context.progress).toBe(100);
    expect(context.integrationId).toBe("int-1");
  });

  it("saves context during execution", async () => {
    await orchestrator.execute(definition, "data_import", {});
    const contexts = await ctxRepo.findByIntegration("int-1");
    expect(contexts.length).toBeGreaterThan(0);
  });

  it("emits SynchronizationRequested and SynchronizationCompleted events", async () => {
    await orchestrator.execute(definition, "data_import", {});
    const requested = orchestrator.events.find(
      (e) => e.constructor.name === "SynchronizationRequested",
    );
    const completed = orchestrator.events.find(
      (e) => e.constructor.name === "SynchronizationCompleted",
    );
    expect(requested).toBeDefined();
    expect(completed).toBeDefined();
  });

  it("throws for missing adapter type", async () => {
    const unknownDef = IntegrationDefinition.reconstitute({
      id: "int-2", restaurantId: "rest-1", name: "Unknown",
      type: "unknown" as never, providerId: "prov-1",
      status: "connected", isActive: true, capabilities: [],
      config: {}, version: 1, tags: [], createdBy: "system",
      createdAt: new Date(), updatedAt: new Date(),
    });
    await expect(orchestrator.execute(unknownDef, "data_import", {}))
      .rejects.toThrow("No adapter for integration type: unknown");
  });

  it("throws for missing active connection", async () => {
    const noConnDef = IntegrationDefinition.reconstitute({
      id: "int-3", restaurantId: "rest-1", name: "No Conn",
      type: "erp", providerId: "prov-1",
      status: "connected", isActive: true, capabilities: [],
      config: {}, version: 1, tags: [], createdBy: "system",
      createdAt: new Date(), updatedAt: new Date(),
    });
    await defRepo.save(noConnDef);
    await expect(orchestrator.execute(noConnDef, "data_import", {}))
      .rejects.toThrow("No active connection");
  });

  it("handles execution failure gracefully", async () => {
    const failingDef = IntegrationDefinition.reconstitute({
      id: "int-4", restaurantId: "rest-1", name: "Failing",
      type: "erp", providerId: "prov-1",
      status: "connected", isActive: true, capabilities: [],
      config: {}, version: 1, tags: [], createdBy: "system",
      createdAt: new Date(), updatedAt: new Date(),
    });
    await defRepo.save(failingDef);
    const failProfile = ConnectionProfile.create({
      id: "conn-4", integrationId: "int-4", restaurantId: "rest-1",
      name: "Fail Conn", authType: "api_key", credentialsRef: "ref", maxRetries: 0,
    });
    await profileRepo.save(failProfile.connect());

    const context = await orchestrator.execute(failingDef, "data_import", { cause: "error" });
    expect(context.status).toBe("completed");
  });

  it("allows registering custom adapters", () => {
    const custom = new (class implements import("../domain/services/IntegrationProviderAdapter.js").IntegrationProviderAdapter {
      readonly providerType = "custom_test";
      async execute() {
        return { success: true, recordsProcessed: 10, processingTimeMs: 100 };
      }
      async validate() { return true; }
      async checkHealth() { return { isOnline: true, responseTimeMs: 10 }; }
      getCapabilities() { return { maxBatchSize: 50, supportsStreaming: false, supportsBulkOperations: false, rateLimit: 10 }; }
    })();
    orchestrator.registerAdapter(custom);
    expect(orchestrator.listAdapters()).toContain("custom_test");
    expect(orchestrator.getAdapter("custom_test")).toBe(custom);
  });
});
