import { describe, it, expect } from "vitest";
import { RestaurantTaxId } from "../domain/models/RestaurantTaxId.js";

describe("RestaurantTaxId", () => {
  describe("create", () => {
    it("creates from a valid tax ID", () => {
      const taxId = RestaurantTaxId.create("12-3456789");
      expect(taxId.value).toBe("12-3456789");
    });

    it("normalizes to uppercase", () => {
      const taxId = RestaurantTaxId.create("abc-def-123");
      expect(taxId.value).toBe("ABC-DEF-123");
    });

    it("trims whitespace", () => {
      const taxId = RestaurantTaxId.create("  12-3456789  ");
      expect(taxId.value).toBe("12-3456789");
    });

    it("throws for too short", () => {
      expect(() => RestaurantTaxId.create("AB")).toThrow(
        "Restaurant tax ID must be at least 3 characters"
      );
    });

    it("throws for too long", () => {
      expect(() => RestaurantTaxId.create("A".repeat(51))).toThrow(
        "Restaurant tax ID cannot exceed 50 characters"
      );
    });

    it("accepts minimal valid tax ID", () => {
      const taxId = RestaurantTaxId.create("ABC");
      expect(taxId.value).toBe("ABC");
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const taxId = RestaurantTaxId.reconstitute("12-3456789");
      expect(taxId.value).toBe("12-3456789");
    });

    it("normalizes to uppercase during reconstitute", () => {
      const taxId = RestaurantTaxId.reconstitute("abc-123");
      expect(taxId.value).toBe("ABC-123");
    });
  });

  describe("equals", () => {
    it("returns true for equal tax IDs", () => {
      const a = RestaurantTaxId.create("12-3456789");
      const b = RestaurantTaxId.create("12-3456789");
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different tax IDs", () => {
      const a = RestaurantTaxId.create("12-3456789");
      const b = RestaurantTaxId.create("98-7654321");
      expect(a.equals(b)).toBe(false);
    });

    it("is case-insensitive for comparison", () => {
      const a = RestaurantTaxId.create("ABC-123");
      const b = RestaurantTaxId.create("abc-123");
      expect(a.equals(b)).toBe(true);
    });
  });
});
