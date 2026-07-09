import { describe, it, expect, vi } from "vitest";
import { RestaurantSlugService } from "../domain/services/RestaurantSlugService.js";
import type { SlugUniquenessChecker } from "../domain/services/RestaurantSlugService.js";
import { RestaurantSlug } from "../domain/models/RestaurantSlug.js";

describe("RestaurantSlugService", () => {
  describe("generateFromName", () => {
    const svc = new RestaurantSlugService({ isSlugTaken: async () => false });

    it("generates slug from simple name", () => {
      expect(svc.generateFromName("My Restaurant")).toBe("my-restaurant");
    });

    it("removes special characters", () => {
      expect(svc.generateFromName("Restaurant @ Cafe!")).toBe("restaurant-cafe");
    });

    it("collapses multiple hyphens", () => {
      expect(svc.generateFromName("Foo   Bar")).toBe("foo-bar");
    });

    it("trims leading and trailing hyphens", () => {
      expect(svc.generateFromName(" - My Place - ")).toBe("my-place");
    });

    it("handles single word", () => {
      expect(svc.generateFromName("Diner")).toBe("diner");
    });
  });

  describe("ensureUnique", () => {
    it("passes when slug is not taken", async () => {
      const checker: SlugUniquenessChecker = { isSlugTaken: async () => false };
      const svc = new RestaurantSlugService(checker);
      const slug = RestaurantSlug.create("my-place");

      const result = await svc.ensureUnique(slug);
      expect(result.value).toBe("my-place");
    });

    it("throws when slug is taken", async () => {
      const checker: SlugUniquenessChecker = { isSlugTaken: async () => true };
      const svc = new RestaurantSlugService(checker);
      const slug = RestaurantSlug.create("my-place");

      await expect(svc.ensureUnique(slug)).rejects.toThrow(
        'Restaurant slug "my-place" is already taken'
      );
    });

    it("passes when slug is taken but excluded", async () => {
      const checker: SlugUniquenessChecker = { isSlugTaken: async () => false };
      const svc = new RestaurantSlugService(checker);
      const slug = RestaurantSlug.create("my-place");

      const result = await svc.ensureUnique(slug, "existing-id");
      expect(result.value).toBe("my-place");
    });

    it("calls checker with excludeId", async () => {
      const isSlugTaken = vi.fn().mockResolvedValue(false);
      const svc = new RestaurantSlugService({ isSlugTaken });
      const slug = RestaurantSlug.create("my-place");

      await svc.ensureUnique(slug, "exclude-me");
      expect(isSlugTaken).toHaveBeenCalledWith("my-place", "exclude-me");
    });
  });

  describe("findAvailableSlug", () => {
    it("returns generated slug when not taken", async () => {
      const checker: SlugUniquenessChecker = { isSlugTaken: async () => false };
      const svc = new RestaurantSlugService(checker);

      const result = await svc.findAvailableSlug("My Restaurant");
      expect(result).toBe("my-restaurant");
    });

    it("appends counter when base slug is taken", async () => {
      let callCount = 0;
      const checker: SlugUniquenessChecker = {
        isSlugTaken: async () => {
          callCount++;
          return callCount === 1;
        },
      };
      const svc = new RestaurantSlugService(checker);

      const result = await svc.findAvailableSlug("My Restaurant");
      expect(result).toBe("my-restaurant-1");
    });

    it("throws when base name generates empty slug", async () => {
      const checker: SlugUniquenessChecker = { isSlugTaken: async () => false };
      const svc = new RestaurantSlugService(checker);

      await expect(svc.findAvailableSlug("@#$%")).rejects.toThrow(
        "Cannot generate a slug from the provided name"
      );
    });

    it("throws when candidate slug exceeds 100 chars", async () => {
      const checker: SlugUniquenessChecker = { isSlugTaken: async () => true };
      const svc = new RestaurantSlugService(checker);

      await expect(svc.findAvailableSlug("a".repeat(100))).rejects.toThrow(
        "Unable to generate a unique slug — base name too long"
      );
    });

    it("throws after exhausting counter attempts", async () => {
      const checker: SlugUniquenessChecker = { isSlugTaken: async () => true };
      const svc = new RestaurantSlugService(checker);

      await expect(svc.findAvailableSlug("test")).rejects.toThrow(
        "Unable to generate a unique slug after 100 attempts"
      );
    });
  });
});
