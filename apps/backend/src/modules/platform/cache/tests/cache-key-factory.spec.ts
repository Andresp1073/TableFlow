import { describe, it, expect } from "vitest";
import { CacheKeyFactory } from "../CacheKeyFactory.js";

describe("CacheKeyFactory", () => {
  describe("entity keys", () => {
    it("generates restaurant key", () => {
      const factory = new CacheKeyFactory();

      factory.registerEntity("restaurant", "restaurant:{id}");

      expect(factory.forRestaurant("123")).toBe("restaurant:123");
    });

    it("generates reservation key", () => {
      const factory = new CacheKeyFactory();

      factory.registerEntity("reservation", "reservation:{id}");

      expect(factory.forReservation("res-abc")).toBe("reservation:res-abc");
    });

    it("generates availability key", () => {
      const factory = new CacheKeyFactory();

      expect(factory.forAvailability("rest-1", "2026-07-14")).toBe("availability:rest-1:2026-07-14");
    });

    it("generates calendar key", () => {
      const factory = new CacheKeyFactory();

      expect(factory.forCalendar("rest-1", "2026-07-14")).toBe("calendar:rest-1:2026-07-14");
    });

    it("falls back to entityType:id when no template registered", () => {
      const factory = new CacheKeyFactory();

      expect(factory.forEntity("unknownEntity", "xyz")).toBe("unknownEntity:xyz");
    });

    it("forEntity uses registered template when available", () => {
      const factory = new CacheKeyFactory();

      factory.registerEntity("user", "user:{id}");

      expect(factory.forEntity("user", "u-42")).toBe("user:u-42");
    });
  });

  describe("build", () => {
    it("replaces single parameter", () => {
      const factory = new CacheKeyFactory();

      expect(factory.build("restaurant:{id}", { id: "42" })).toBe("restaurant:42");
    });

    it("replaces multiple parameters", () => {
      const factory = new CacheKeyFactory();

      expect(factory.build("availability:{restaurantId}:{date}", { restaurantId: "r1", date: "2026-07-14" })).toBe("availability:r1:2026-07-14");
    });

    it("handles numeric parameters", () => {
      const factory = new CacheKeyFactory();

      expect(factory.build("page:{number}", { number: 5 })).toBe("page:5");
    });
  });

  describe("named templates", () => {
    it("registers and resolves a named template", () => {
      const factory = new CacheKeyFactory();

      factory.registerTemplate("session", "user:session:{sessionId}");

      expect(factory.fromTemplate("session", { sessionId: "sess-1" })).toBe("user:session:sess-1");
    });

    it("returns null for unknown template name", () => {
      const factory = new CacheKeyFactory();

      expect(factory.fromTemplate("nonexistent", {})).toBeNull();
    });

    it("registerTemplates registers multiple at once", () => {
      const factory = new CacheKeyFactory();

      factory.registerTemplates({
        "a": "type:a:{id}",
        "b": "type:b:{id}",
      });

      expect(factory.fromTemplate("a", { id: "1" })).toBe("type:a:1");
      expect(factory.fromTemplate("b", { id: "2" })).toBe("type:b:2");
    });
  });

  describe("prefix", () => {
    it("returns entity type prefix", () => {
      const factory = new CacheKeyFactory();

      expect(factory.prefix("restaurant")).toBe("restaurant:");
    });
  });

  describe("template queries", () => {
    it("hasEntityTemplate returns correct value", () => {
      const factory = new CacheKeyFactory();

      factory.registerEntity("menu", "menu:{id}");

      expect(factory.hasEntityTemplate("menu")).toBe(true);
      expect(factory.hasEntityTemplate("nonexistent")).toBe(false);
    });

    it("hasNamedTemplate returns correct value", () => {
      const factory = new CacheKeyFactory();

      factory.registerTemplate("my_template", "my:{id}");

      expect(factory.hasNamedTemplate("my_template")).toBe(true);
      expect(factory.hasNamedTemplate("unknown")).toBe(false);
    });

    it("getEntityTemplate returns the template string", () => {
      const factory = new CacheKeyFactory();

      factory.registerEntity("table", "table:{id}");

      expect(factory.getEntityTemplate("table")).toBe("table:{id}");
    });

    it("getNamedTemplate returns the template string", () => {
      const factory = new CacheKeyFactory();

      factory.registerTemplate("config", "config:{key}");

      expect(factory.getNamedTemplate("config")).toBe("config:{key}");
    });
  });

  describe("registerEntities", () => {
    it("registers multiple entity templates", () => {
      const factory = new CacheKeyFactory();

      factory.registerEntities([
        { entityType: "product", template: "product:{id}" },
        { entityType: "order", template: "order:{id}" },
      ]);

      expect(factory.forEntity("product", "p1")).toBe("product:p1");
      expect(factory.forEntity("order", "o1")).toBe("order:o1");
    });
  });

  describe("createDefault", () => {
    it("creates factory with standard entity templates", () => {
      const factory = CacheKeyFactory.createDefault();

      expect(factory.forRestaurant("42")).toBe("restaurant:42");
      expect(factory.forReservation("res-1")).toBe("reservation:res-1");
      expect(factory.forEntity("table", "t-1")).toBe("table:t-1");
      expect(factory.forEntity("waitlist", "w-1")).toBe("waitlist:w-1");
    });

    it("creates factory with standard named templates", () => {
      const factory = CacheKeyFactory.createDefault();

      expect(factory.forAvailability("r1", "2026-07-14")).toBe("availability:r1:2026-07-14");
      expect(factory.forCalendar("r1", "2026-07-14")).toBe("calendar:r1:2026-07-14");
      expect(factory.fromTemplate("user:session", { sessionId: "s1" })).toBe("user:session:s1");
    });
  });
});
