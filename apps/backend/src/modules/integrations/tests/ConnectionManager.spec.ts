import { describe, it, expect, beforeEach } from "vitest";
import { ConnectionManager } from "../domain/services/ConnectionManager.js";
import { InMemoryConnectionProfileRepository } from "../infrastructure/repositories/InMemoryIntegrationRepositories.js";

describe("ConnectionManager", () => {
  let repo: InMemoryConnectionProfileRepository;
  let manager: ConnectionManager;

  beforeEach(() => {
    repo = new InMemoryConnectionProfileRepository();
    manager = new ConnectionManager(repo);
  });

  it("creates a connection profile", async () => {
    const profile = await manager.createConnection({
      integrationId: "int-1", restaurantId: "rest-1",
      name: "Main", authType: "oauth2",
      credentialsRef: "secret/oauth", baseUrl: "https://api.example.com",
    });
    expect(profile.status).toBe("pending");
    expect(profile.integrationId).toBe("int-1");
    expect(profile.baseUrl).toBe("https://api.example.com");
  });

  it("connects a profile", async () => {
    const created = await manager.createConnection({
      integrationId: "int-1", restaurantId: "rest-1",
      name: "Main", authType: "api_key", credentialsRef: "secret/key",
    });
    const connected = await manager.connect(created.id);
    expect(connected.status).toBe("connected");
    expect(connected.lastConnectedAt).toBeInstanceOf(Date);
  });

  it("disconnects a profile", async () => {
    const created = await manager.createConnection({
      integrationId: "int-1", restaurantId: "rest-1",
      name: "Main", authType: "api_key", credentialsRef: "secret/key",
    });
    await manager.connect(created.id);
    const disconnected = await manager.disconnect(created.id, "Scheduled maintenance");
    expect(disconnected.status).toBe("disconnected");
  });

  it("fails a profile and retries", async () => {
    const created = await manager.createConnection({
      integrationId: "int-1", restaurantId: "rest-1",
      name: "Main", authType: "api_key",
      credentialsRef: "secret/key", maxRetries: 3,
    });
    const result = await manager.fail(created.id, "Timeout error");
    expect(result.status).toBe("failed");
    expect(result.errorMessage).toBe("Timeout error");
    const saved = await repo.findById(created.id);
    expect(saved?.retryCount).toBeGreaterThanOrEqual(1);
  });

  it("retrieves profiles by integration", async () => {
    await manager.createConnection({
      integrationId: "int-1", restaurantId: "rest-1",
      name: "Primary", authType: "api_key", credentialsRef: "secret/key",
    });
    await manager.createConnection({
      integrationId: "int-1", restaurantId: "rest-1",
      name: "Secondary", authType: "oauth2", credentialsRef: "secret/oauth",
    });
    const profiles = await manager.getProfilesByIntegration("int-1");
    expect(profiles.length).toBe(2);
  });

  it("finds active profile for integration", async () => {
    const created = await manager.createConnection({
      integrationId: "int-1", restaurantId: "rest-1",
      name: "Main", authType: "api_key", credentialsRef: "secret/key",
    });
    await manager.connect(created.id);
    const active = await manager.getActiveProfile("int-1");
    expect(active).not.toBeNull();
    expect(active!.isConnected()).toBe(true);
  });

  it("emits IntegrationConnected event on connect", async () => {
    const created = await manager.createConnection({
      integrationId: "int-1", restaurantId: "rest-1",
      name: "Main", authType: "api_key", credentialsRef: "secret/key",
    });
    await manager.connect(created.id);
    expect(manager.events.length).toBeGreaterThan(0);
  });

  it("throws when connecting non-existent profile", async () => {
    await expect(manager.connect("nonexistent")).rejects.toThrow("Connection profile not found");
  });

  it("throws when disconnecting non-existent profile", async () => {
    await expect(manager.disconnect("nonexistent")).rejects.toThrow("Connection profile not found");
  });
});
