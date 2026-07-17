import { describe, it, expect, beforeEach } from "vitest";
import { HealthMonitor } from "../domain/services/HealthMonitor.js";
import { InMemoryIntegrationHealthRepository, InMemoryConnectionProfileRepository } from "../infrastructure/repositories/InMemoryIntegrationRepositories.js";
import { ConnectionProfile } from "../domain/models/ConnectionProfile.js";
import { ERPAdapter } from "../domain/services/IntegrationProviderAdapter.js";

describe("HealthMonitor", () => {
  let healthRepo: InMemoryIntegrationHealthRepository;
  let profileRepo: InMemoryConnectionProfileRepository;
  let monitor: HealthMonitor;
  let profile: ConnectionProfile;

  beforeEach(async () => {
    healthRepo = new InMemoryIntegrationHealthRepository();
    profileRepo = new InMemoryConnectionProfileRepository();
    monitor = new HealthMonitor(healthRepo, profileRepo);

    profile = ConnectionProfile.create({
      id: "conn-1", integrationId: "int-1", restaurantId: "rest-1",
      name: "Test", authType: "api_key", credentialsRef: "ref", maxRetries: 3,
    });
    await profileRepo.save(profile);
  });

  it("checks health and returns result", async () => {
    const adapter = new ERPAdapter();
    const health = await monitor.checkHealth("int-1", "conn-1", "rest-1", adapter);
    expect(health.integrationId).toBe("int-1");
    expect(health.isOnline).toBe(true);
    expect(health.checks.length).toBeGreaterThan(0);
  });

  it("saves health record to repository", async () => {
    const adapter = new ERPAdapter();
    await monitor.checkHealth("int-1", "conn-1", "rest-1", adapter);
    const latest = await healthRepo.findLatestByIntegration("int-1");
    expect(latest).not.toBeNull();
    expect(latest!.restaurantId).toBe("rest-1");
  });

  it("updates profile health check timestamp", async () => {
    const adapter = new ERPAdapter();
    await monitor.checkHealth("int-1", "conn-1", "rest-1", adapter);
    const updated = await profileRepo.findById("conn-1");
    expect(updated!.lastHealthCheckAt).toBeInstanceOf(Date);
  });

  it("returns latest health record", async () => {
    const adapter = new ERPAdapter();
    await monitor.checkHealth("int-1", "conn-1", "rest-1", adapter);
    const latest = await monitor.getLatestHealth("int-1");
    expect(latest).not.toBeNull();
    expect(latest!.isOnline).toBe(true);
  });

  it("returns empty for nonexistent health records", async () => {
    const latest = await monitor.getLatestHealth("nonexistent");
    expect(latest).toBeNull();
  });

  it("records health manually", async () => {
    const health = await monitor.recordHealth(
      "int-1", "rest-1", "healthy", 50,
      [{ name: "connectivity", status: "healthy", responseTimeMs: 50 }],
      true, "All systems operational",
    );
    expect(health.isHealthy()).toBe(true);
    expect(health.responseTimeMs).toBe(50);
  });

  it("finds unhealthy integrations", async () => {
    await monitor.recordHealth("int-1", "rest-1", "unhealthy", 500,
      [{ name: "connectivity", status: "unhealthy", responseTimeMs: 500, message: "Timeout" }],
      false,
    );
    const unhealthy = await monitor.getUnhealthyIntegrations("rest-1");
    expect(unhealthy.length).toBe(1);
    expect(unhealthy[0].isOnline).toBe(false);
  });

  it("throws for nonexistent profile on health check", async () => {
    const adapter = new ERPAdapter();
    await expect(monitor.checkHealth("int-1", "nonexistent", "rest-1", adapter))
      .rejects.toThrow("Connection profile not found");
  });
});
