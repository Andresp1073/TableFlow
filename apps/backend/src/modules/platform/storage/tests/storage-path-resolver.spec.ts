import { describe, it, expect } from "vitest";
import { StoragePathResolver } from "../StoragePathResolver.js";

describe("StoragePathResolver", () => {
  let resolver: StoragePathResolver;

  beforeEach(() => {
    resolver = new StoragePathResolver();
  });

  describe("path resolution by pattern", () => {
    it("resolves restaurant logo path", () => {
      const result = resolver.resolveRestaurantLogo("r-123", "png");

      expect(result.path).toBe("restaurants/r-123/logo.png");
      expect(result.bucket).toBe("tableflow");
    });

    it("resolves restaurant menu path", () => {
      const result = resolver.resolveRestaurantMenu("r-456", "m-789", "pdf");

      expect(result.path).toBe("menus/r-456/m-789.pdf");
    });

    it("resolves reservation attachment path", () => {
      const result = resolver.resolveReservationAttachment("res-abc", "special-request.pdf");

      expect(result.path).toBe("reservations/res-abc/special-request.pdf");
    });

    it("resolves user avatar path", () => {
      const result = resolver.resolveUserAvatar("u-123", "jpg");

      expect(result.path).toBe("users/u-123/avatar.jpg");
    });

    it("resolves export path with timestamp", () => {
      const result = resolver.resolveExport("csv", "export-123", "csv");

      expect(result.path).toMatch(/^exports\/csv\/.*-export-123\.csv$/);
    });

    it("resolves backup path with date", () => {
      const today = new Date().toISOString().slice(0, 10);

      const result = resolver.resolveBackup("database", "full-dump.sql");

      expect(result.path).toBe(`backups/database/${today}/full-dump.sql`);
    });

    it("resolves custom path as-is", () => {
      const result = resolver.resolveCustom("custom/any/path/file.txt");

      expect(result.path).toBe("custom/any/path/file.txt");
    });
  });

  describe("resolve with custom bucket", () => {
    it("accepts custom bucket override", () => {
      const result = resolver.resolveRestaurantLogo("r-1", "png", "assets-bucket");

      expect(result.bucket).toBe("assets-bucket");
    });
  });

  describe("resolve generic", () => {
    it("resolves with params", () => {
      const result = resolver.resolve("restaurant-logo", { restaurantId: "r-1", ext: "png" });

      expect(result.path).toBe("restaurants/r-1/logo.png");
    });

    it("throws on missing parameters", () => {
      expect(() => resolver.resolve("restaurant-logo", { restaurantId: "r-1" })).toThrow();
    });
  });

  describe("getTemplate", () => {
    it("returns template config for valid pattern", () => {
      const template = resolver.getTemplate("restaurant-logo");

      expect(template.pattern).toBe("restaurants/{restaurantId}/logo.{ext}");
      expect(template.examples.length).toBeGreaterThan(0);
    });

    it("throws for unknown pattern", () => {
      expect(() => resolver.getTemplate("invalid-pattern" as any)).toThrow();
    });
  });

  describe("getAllTemplates", () => {
    it("returns all path templates", () => {
      const templates = resolver.getAllTemplates();

      expect(Object.keys(templates)).toContain("restaurant-logo");
      expect(Object.keys(templates)).toContain("restaurant-menu");
      expect(Object.keys(templates)).toContain("backup");
    });
  });

  describe("parsePath", () => {
    it("parses restaurant logo path", () => {
      const result = resolver.parsePath("restaurants/r-123/logo.png");

      expect(result.pattern).toBe("restaurant-logo");
      expect(result.params["restaurantId"]).toBe("r-123");
      expect(result.params["ext"]).toBe("png");
    });

    it("parses reservation attachment path", () => {
      const result = resolver.parsePath("reservations/res-abc/request.pdf");

      expect(result.pattern).toBe("reservation-attachment");
      expect(result.params["reservationId"]).toBe("res-abc");
      expect(result.params["filename"]).toBe("request.pdf");
    });

    it("returns null for unrecognized path", () => {
      const result = resolver.parsePath("unknown/path/file.txt");

      expect(result.pattern).toBeNull();
    });
  });

  describe("utility methods", () => {
    it("joins path segments", () => {
      expect(resolver.join("restaurants", "r-123", "logo.png")).toBe("restaurants/r-123/logo.png");
    });

    it("handles leading/trailing slashes in join", () => {
      expect(resolver.join("/restaurants/", "/r-123/", "logo.png")).toBe("restaurants/r-123/logo.png");
    });

    it("returns dirname of path", () => {
      expect(resolver.dirname("restaurants/r-123/logo.png")).toBe("restaurants/r-123");
    });

    it("returns basename of path", () => {
      expect(resolver.basename("restaurants/r-123/logo.png")).toBe("logo.png");
    });

    it("returns file extension", () => {
      expect(resolver.extension("restaurants/r-123/logo.png")).toBe("png");
    });

    it("returns empty extension for files without extension", () => {
      expect(resolver.extension("restaurants/r-123/logo")).toBe("");
    });
  });

  describe("getDefaultBucket", () => {
    it("returns default bucket name", () => {
      expect(resolver.getDefaultBucket()).toBe("tableflow");
    });

    it("returns custom default bucket", () => {
      const customResolver = new StoragePathResolver("custom-bucket");

      expect(customResolver.getDefaultBucket()).toBe("custom-bucket");
    });
  });

  describe("sanitization", () => {
    it("sanitizes path parameters", () => {
      const result = resolver.resolveRestaurantLogo("r-123/../etc", "png");

      expect(result.path).toBe("restaurants/r-123_.._etc/logo.png");
    });
  });
});
