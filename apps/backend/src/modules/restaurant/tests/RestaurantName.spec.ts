import { describe, it, expect } from "vitest";
import { RestaurantName } from "../domain/models/RestaurantName.js";

describe("RestaurantName", () => {
  describe("create", () => {
    it("creates from a valid name", () => {
      const name = RestaurantName.create("My Restaurant");
      expect(name.value).toBe("My Restaurant");
    });

    it("trims whitespace", () => {
      const name = RestaurantName.create("  My Restaurant  ");
      expect(name.value).toBe("My Restaurant");
    });

    it("throws for empty string", () => {
      expect(() => RestaurantName.create("")).toThrow("Restaurant name cannot be empty");
    });

    it("throws for whitespace-only string", () => {
      expect(() => RestaurantName.create("   ")).toThrow("Restaurant name cannot be empty");
    });

    it("throws for name exceeding 255 characters", () => {
      expect(() => RestaurantName.create("x".repeat(256))).toThrow(
        "Restaurant name cannot exceed 255 characters"
      );
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const name = RestaurantName.reconstitute("Some Restaurant");
      expect(name.value).toBe("Some Restaurant");
    });
  });

  describe("equals", () => {
    it("returns true for equal names", () => {
      const a = RestaurantName.create("Foo");
      const b = RestaurantName.create("Foo");
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different names", () => {
      const a = RestaurantName.create("Foo");
      const b = RestaurantName.create("Bar");
      expect(a.equals(b)).toBe(false);
    });
  });
});
