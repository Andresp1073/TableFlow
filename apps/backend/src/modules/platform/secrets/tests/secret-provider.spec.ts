import { describe, it, expect, vi, beforeEach } from "vitest";
import { SecretManager } from "../SecretManager.js";
import { SecretType } from "../types.js";

describe("SecretProvider interface", () => {
  let manager: SecretManager;

  beforeEach(() => {
    manager = new SecretManager();
  });

  it("resolves secrets through source priority order", async () => {
    const lowPrioritySource = {
      name: "low",
      priority: 100,
      enabled: true,
      get: vi.fn().mockResolvedValue(null),
      has: vi.fn().mockResolvedValue(false),
      getAll: vi.fn().mockResolvedValue([]),
    };

    const highPrioritySource = {
      name: "high",
      priority: 10,
      enabled: true,
      get: vi.fn().mockResolvedValue({
        metadata: {
          id: "high",
          key: "api_test",
          type: SecretType.ApiKey,
          name: "Test",
          currentVersion: 1,
          versions: [{
            version: 1,
            value: { key: "from-high-priority" },
            createdAt: new Date(),
            status: "active",
          }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        current: { key: "from-high-priority" },
      }),
      has: vi.fn().mockResolvedValue(true),
      getAll: vi.fn().mockResolvedValue([]),
    };

    manager.addSource(lowPrioritySource);
    manager.addSource(highPrioritySource);

    const result = await manager.provider.getSecret("api_test", SecretType.ApiKey);

    expect(result).toEqual({ key: "from-high-priority" });
    expect(highPrioritySource.get).toHaveBeenCalledTimes(1);
    expect(lowPrioritySource.get).not.toHaveBeenCalled();
  });

  it("skips disabled sources", async () => {
    const disabledSource = {
      name: "disabled",
      priority: 10,
      enabled: false,
      get: vi.fn(),
      has: vi.fn(),
      getAll: vi.fn().mockResolvedValue([]),
    };

    const enabledSource = {
      name: "enabled",
      priority: 20,
      enabled: true,
      get: vi.fn().mockResolvedValue({
        metadata: {
          id: "enabled",
          key: "api_test",
          type: SecretType.ApiKey,
          name: "Test",
          currentVersion: 1,
          versions: [{
            version: 1,
            value: { key: "from-enabled" },
            createdAt: new Date(),
            status: "active",
          }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        current: { key: "from-enabled" },
      }),
      has: vi.fn().mockResolvedValue(true),
      getAll: vi.fn().mockResolvedValue([]),
    };

    manager.addSource(disabledSource);
    manager.addSource(enabledSource);

    const result = await manager.provider.getSecret("api_test", SecretType.ApiKey);

    expect(result).toEqual({ key: "from-enabled" });
    expect(disabledSource.get).not.toHaveBeenCalled();
  });

  it("returns null when no source has the secret", async () => {
    const source = {
      name: "test",
      priority: 10,
      enabled: true,
      get: vi.fn().mockResolvedValue(null),
      has: vi.fn().mockResolvedValue(false),
      getAll: vi.fn().mockResolvedValue([]),
    };

    manager.addSource(source);

    const result = await manager.provider.getSecret("missing", SecretType.ApiKey);

    expect(result).toBeNull();
  });

  it("provides typed secrets through generics", async () => {
    const source = {
      name: "test",
      priority: 10,
      enabled: true,
      get: vi.fn().mockResolvedValue({
        metadata: {
          id: "db",
          key: "db_main",
          type: SecretType.DatabaseCredentials,
          name: "DB",
          currentVersion: 1,
          versions: [{
            version: 1,
            value: {
              host: "db.example.com",
              port: 5432,
              username: "app_user",
              password: "strong_password",
              database: "tableflow",
              ssl: true,
            },
            createdAt: new Date(),
            status: "active",
          }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        current: {
          host: "db.example.com",
          port: 5432,
          username: "app_user",
          password: "strong_password",
          database: "tableflow",
          ssl: true,
        },
      }),
      has: vi.fn().mockResolvedValue(true),
      getAll: vi.fn().mockResolvedValue([]),
    };

    manager.addSource(source);

    const credentials = await manager.provider.getSecret<import("../types.js").DatabaseCredentials>(
      "db_main",
      SecretType.DatabaseCredentials,
    );

    expect(credentials).not.toBeNull();
    expect(credentials!.host).toBe("db.example.com");
    expect(credentials!.port).toBe(5432);
    expect(credentials!.ssl).toBe(true);
  });
});
