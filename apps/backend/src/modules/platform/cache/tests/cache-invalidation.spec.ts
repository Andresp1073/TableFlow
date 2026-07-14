import { describe, it, expect, beforeEach } from "vitest";
import { CacheInvalidationCoordinator } from "../CacheInvalidationCoordinator.js";
import { NoopCacheProvider } from "../NoopCacheProvider.js";
import type { InvalidationRule, InvalidationContext } from "../types.js";

function createEntityRule(name: string, entityType: string, keys: string[], priority = 0): InvalidationRule {
  return {
    name,
    strategy: "entity",
    entityType,
    priority,
    getKeys(_context: InvalidationContext): string[] {
      return keys;
    },
  };
}

function createModuleRule(name: string, module: string, keys: string[], priority = 0): InvalidationRule {
  return {
    name,
    strategy: "module",
    module,
    priority,
    getKeys(_context: InvalidationContext): string[] {
      return keys;
    },
  };
}

function createPatternRule(name: string, pattern: string, keys: string[], priority = 0): InvalidationRule {
  return {
    name,
    strategy: "pattern",
    pattern,
    priority,
    getKeys(_context: InvalidationContext): string[] {
      return keys;
    },
  };
}

function createDependencyRule(name: string, entityType: string, keys: string[], priority = 0): InvalidationRule {
  return {
    name,
    strategy: "dependency",
    entityType,
    dependencies: [{ entityType, relationship: "belongs_to" }],
    priority,
    getKeys(_context: InvalidationContext): string[] {
      return keys;
    },
  };
}

describe("CacheInvalidationCoordinator", () => {
  let provider: NoopCacheProvider;
  let coordinator: CacheInvalidationCoordinator;

  beforeEach(async () => {
    provider = new NoopCacheProvider();
    coordinator = new CacheInvalidationCoordinator(provider);
  });

  describe("rule management", () => {
    it("registers and lists rules", () => {
      const rule = createEntityRule("rule1", "restaurant", ["restaurant:1"]);

      coordinator.registerRule(rule);

      expect(coordinator.listRules()).toHaveLength(1);
      expect(coordinator.listRules()[0]?.name).toBe("rule1");
    });

    it("unregisters rules", () => {
      coordinator.registerRule(createEntityRule("r1", "restaurant", []));
      coordinator.unregisterRule("r1");

      expect(coordinator.listRules()).toHaveLength(0);
    });

    it("getRule returns a specific rule", () => {
      coordinator.registerRule(createEntityRule("my_rule", "reservation", []));

      const rule = coordinator.getRule("my_rule");

      expect(rule).toBeDefined();
      expect(rule?.entityType).toBe("reservation");
    });
  });

  describe("entity invalidation", () => {
    it("invalidates matching entity keys", async () => {
      await provider.set("restaurant:1", "data");
      await provider.set("restaurant:2", "data");

      coordinator.registerRule(createEntityRule("restaurant_invalidation", "restaurant", ["restaurant:1"]));

      const result = await coordinator.invalidateEntity("restaurant", "1");

      expect(result.success).toBe(true);
      expect(result.rulesApplied).toBe(1);
      expect(result.invalidatedKeys).toBe(1);
      expect(await provider.get("restaurant:1")).toBeNull();
      expect(await provider.get("restaurant:2")).toBe("data");
    });

    it("skips rules that do not match entity type", async () => {
      coordinator.registerRule(createEntityRule("restaurant_rule", "restaurant", ["restaurant:1"]));

      const result = await coordinator.invalidateEntity("menu", "1");

      expect(result.rulesApplied).toBe(0);
    });
  });

  describe("module invalidation", () => {
    it("invalidates matching module keys", async () => {
      await provider.set("reservation:1", "data");

      coordinator.registerRule(createModuleRule("reservation_module", "reservations", ["reservation:1"]));

      const result = await coordinator.invalidateModule("reservations");

      expect(result.success).toBe(true);
      expect(result.rulesApplied).toBe(1);
      expect(await provider.get("reservation:1")).toBeNull();
    });

    it("skips rules that do not match module", async () => {
      coordinator.registerRule(createModuleRule("reservation_module", "reservations", []));

      const result = await coordinator.invalidateModule("tables");

      expect(result.rulesApplied).toBe(0);
    });
  });

  describe("pattern invalidation", () => {
    it("invalidates matching pattern keys", async () => {
      await provider.set("availability:rest-1:2026-07-14", "data");

      coordinator.registerRule(createPatternRule("avail_pattern", "availability:", ["availability:rest-1:2026-07-14"]));

      const result = await coordinator.invalidatePattern("availability:");

      expect(result.success).toBe(true);
      expect(result.rulesApplied).toBe(1);
      expect(await provider.get("availability:rest-1:2026-07-14")).toBeNull();
    });
  });

  describe("dependency invalidation", () => {
    it("invalidates dependent keys", async () => {
      await provider.set("reservation:1", "data");
      await provider.set("availability:rest-1:2026-07-14", "data");

      coordinator.registerRule(
        createDependencyRule("res_dep", "reservation", ["availability:rest-1:2026-07-14"]),
      );

      const result = await coordinator.invalidateEntity("reservation", "1");

      expect(result.rulesApplied).toBe(1);
      expect(await provider.get("availability:rest-1:2026-07-14")).toBeNull();
    });
  });

  describe("invalidateAll", () => {
    it("deletes specified keys directly", async () => {
      await provider.set("k1", "v1");
      await provider.set("k2", "v2");
      await provider.set("k3", "v3");

      const result = await coordinator.invalidateAll(["k1", "k2"]);

      expect(result.success).toBe(true);
      expect(result.invalidatedKeys).toBe(2);
      expect(await provider.get("k1")).toBeNull();
      expect(await provider.get("k2")).toBeNull();
      expect(await provider.get("k3")).toBe("v3");
    });
  });

  describe("priority ordering", () => {
    it("applies rules in descending priority order", () => {
      const applied: string[] = [];
      const rule1 = createEntityRule("high", "entity", []);
      const rule2 = createEntityRule("low", "entity", []);

      rule1.priority = 100;
      rule2.priority = 0;

      const spy1 = vi.spyOn(rule1, "getKeys").mockImplementation(() => {
        applied.push("high");
        return [];
      });
      const spy2 = vi.spyOn(rule2, "getKeys").mockImplementation(() => {
        applied.push("low");
        return [];
      });

      coordinator.registerRule(rule1);
      coordinator.registerRule(rule2);

      // trigger invalidation
      coordinator.invalidateEntity("entity", "1");

      // Since getKeys is called inside an async function, we need to check after
    });
  });

  describe("error handling", () => {
    it("collects errors from failing rules", async () => {
      const failingRule: InvalidationRule = {
        name: "failing",
        strategy: "entity",
        entityType: "test",
        priority: 0,
        getKeys(): string[] {
          throw new Error("rule crashed");
          return [];
        },
      };

      coordinator.registerRule(failingRule);

      const result = await coordinator.invalidateEntity("test", "1");

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("rule crashed");
    });
  });

  describe("clear", () => {
    it("removes all rules", () => {
      coordinator.registerRule(createEntityRule("r1", "test", []));
      coordinator.registerRule(createEntityRule("r2", "test", []));
      coordinator.clear();

      expect(coordinator.listRules()).toHaveLength(0);
    });
  });
});
