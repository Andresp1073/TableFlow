import { describe, it, expect } from "vitest";
import { ERPAdapter, CRMAdapter, POSAdapter, AccountingAdapter, PaymentsAdapter, MarketingAdapter, MessagingAdapter, AnalyticsAdapter, IdentityAdapter, CustomAdapter } from "../domain/services/IntegrationProviderAdapter.js";
import { IntegrationContext } from "../domain/models/IntegrationContext.js";
import { IntegrationDefinition } from "../domain/models/IntegrationDefinition.js";
import { ConnectionProfile } from "../domain/models/ConnectionProfile.js";

function makeContext(): IntegrationContext {
  return IntegrationContext.reconstitute({
    id: "ctx-1", integrationId: "int-1", restaurantId: "rest-1",
    mode: "sync", status: "running", capability: "data_import",
    payload: {}, progress: 0, createdAt: new Date(),
  });
}

function makeDefinition(): IntegrationDefinition {
  return IntegrationDefinition.reconstitute({
    id: "int-1", restaurantId: "rest-1", name: "Test", type: "erp",
    providerId: "prov-1", status: "connected", isActive: true,
    capabilities: [], config: {}, version: 1, tags: [],
    createdAt: new Date(), updatedAt: new Date(), createdBy: "system",
  });
}

function makeProfile(): ConnectionProfile {
  return ConnectionProfile.reconstitute({
    id: "conn-1", integrationId: "int-1", restaurantId: "rest-1",
    name: "Test", authType: "api_key", credentialsRef: "ref",
    status: "connected", retryCount: 0, maxRetries: 3,
    createdAt: new Date(), updatedAt: new Date(),
  });
}

describe("IntegrationProviderAdapter", () => {
  const context = makeContext();
  const definition = makeDefinition();
  const profile = makeProfile();

  const adapters = [
    { Adapter: ERPAdapter, type: "erp" },
    { Adapter: CRMAdapter, type: "crm" },
    { Adapter: POSAdapter, type: "pos" },
    { Adapter: AccountingAdapter, type: "accounting" },
    { Adapter: PaymentsAdapter, type: "payments" },
    { Adapter: MarketingAdapter, type: "marketing" },
    { Adapter: MessagingAdapter, type: "messaging" },
    { Adapter: AnalyticsAdapter, type: "analytics" },
    { Adapter: IdentityAdapter, type: "identity" },
    { Adapter: CustomAdapter, type: "custom" },
  ];

  for (const { Adapter, type } of adapters) {
    describe(`${type} adapter`, () => {
      const adapter = new Adapter();

      it(`has provider type ${type}`, () => {
        expect(adapter.providerType).toBe(type);
      });

      it("executes and returns a result", async () => {
        const result = await adapter.execute(context, definition, profile);
        expect(result.success).toBe(true);
        expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
      });

      it("validates successfully", async () => {
        await expect(adapter.validate(definition, profile)).resolves.toBe(true);
      });

      it("checks health", async () => {
        const health = await adapter.checkHealth(profile);
        expect(health.isOnline).toBe(true);
        expect(health.responseTimeMs).toBeGreaterThanOrEqual(0);
        expect(health.message).toBeDefined();
      });

      it("returns capabilities", () => {
        const caps = adapter.getCapabilities();
        expect(caps.maxBatchSize).toBeGreaterThan(0);
        expect(caps.rateLimit).toBeGreaterThan(0);
      });
    });
  }
});
