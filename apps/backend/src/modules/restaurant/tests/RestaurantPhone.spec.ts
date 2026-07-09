import { describe, it, expect } from "vitest";
import { RestaurantPhone } from "../domain/models/RestaurantPhone.js";

describe("RestaurantPhone", () => {
  describe("create", () => {
    it("creates from a valid phone number", () => {
      const phone = RestaurantPhone.create("+1234567890");
      expect(phone.value).toBe("+1234567890");
    });

    it("trims whitespace", () => {
      const phone = RestaurantPhone.create("  +1 (234) 567-890  ");
      expect(phone.value).toBe("+1 (234) 567-890");
    });

    it("throws for too short", () => {
      expect(() => RestaurantPhone.create("12345")).toThrow(
        "Restaurant phone must be at least 6 characters"
      );
    });

    it("throws for too long", () => {
      expect(() => RestaurantPhone.create("1".repeat(21))).toThrow(
        "Restaurant phone cannot exceed 20 characters"
      );
    });

    it("throws for insufficient digits", () => {
      expect(() => RestaurantPhone.create("a1b2c3")).toThrow(
        "Restaurant phone must contain at least 6 digits"
      );
    });

    it("accepts phone with formatting", () => {
      const phone = RestaurantPhone.create("+1 (212) 555-0198");
      expect(phone.value).toBe("+1 (212) 555-0198");
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const phone = RestaurantPhone.reconstitute("+1234567890");
      expect(phone.value).toBe("+1234567890");
    });
  });

  describe("getDigits", () => {
    it("returns only digits", () => {
      const phone = RestaurantPhone.create("+1 (212) 555-0198");
      expect(phone.getDigits()).toBe("12125550198");
    });
  });

  describe("equals", () => {
    it("returns true for equal phone numbers", () => {
      const a = RestaurantPhone.create("+1234567890");
      const b = RestaurantPhone.create("+1234567890");
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different phone numbers", () => {
      const a = RestaurantPhone.create("+1234567890");
      const b = RestaurantPhone.create("+0987654321");
      expect(a.equals(b)).toBe(false);
    });
  });
});
