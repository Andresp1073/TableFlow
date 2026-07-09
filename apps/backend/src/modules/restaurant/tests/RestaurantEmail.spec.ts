import { describe, it, expect } from "vitest";
import { RestaurantEmail } from "../domain/models/RestaurantEmail.js";

describe("RestaurantEmail", () => {
  describe("create", () => {
    it("creates from a valid email", () => {
      const email = RestaurantEmail.create("contact@example.com");
      expect(email.value).toBe("contact@example.com");
    });

    it("normalizes to lowercase", () => {
      const email = RestaurantEmail.create("User@Example.COM");
      expect(email.value).toBe("user@example.com");
    });

    it("trims whitespace", () => {
      const email = RestaurantEmail.create("  test@example.com  ");
      expect(email.value).toBe("test@example.com");
    });

    it("throws for empty string", () => {
      expect(() => RestaurantEmail.create("")).toThrow("Restaurant email cannot be empty");
    });

    it("throws for missing @", () => {
      expect(() => RestaurantEmail.create("notanemail")).toThrow(
        "Restaurant email must be a valid email address"
      );
    });

    it("throws for missing domain", () => {
      expect(() => RestaurantEmail.create("user@")).toThrow(
        "Restaurant email must be a valid email address"
      );
    });

    it("throws for missing local part", () => {
      expect(() => RestaurantEmail.create("@domain.com")).toThrow(
        "Restaurant email must be a valid email address"
      );
    });

    it("throws for excessively long email", () => {
      const local = "a".repeat(250);
      expect(() => RestaurantEmail.create(`${local}@b.com`)).toThrow(
        "Restaurant email cannot exceed 255 characters"
      );
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const email = RestaurantEmail.reconstitute("TEST@EXAMPLE.COM");
      expect(email.value).toBe("test@example.com");
    });
  });

  describe("equals", () => {
    it("returns true for equal emails", () => {
      const a = RestaurantEmail.create("a@b.com");
      const b = RestaurantEmail.create("a@b.com");
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different emails", () => {
      const a = RestaurantEmail.create("a@b.com");
      const b = RestaurantEmail.create("x@y.com");
      expect(a.equals(b)).toBe(false);
    });
  });
});
