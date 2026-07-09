import { describe, it, expect } from "vitest";
import { RestaurantTimezone } from "../domain/models/RestaurantTimezone.js";

describe("RestaurantTimezone", () => {
  describe("create", () => {
    it("creates from a valid timezone", () => {
      const tz = RestaurantTimezone.create("America/New_York");
      expect(tz.value).toBe("America/New_York");
    });

    it("creates UTC timezone", () => {
      const tz = RestaurantTimezone.create("UTC");
      expect(tz.value).toBe("UTC");
    });

    it("throws for empty string", () => {
      expect(() => RestaurantTimezone.create("")).toThrow("Restaurant timezone cannot be empty");
    });

    it("throws for unknown timezone", () => {
      expect(() => RestaurantTimezone.create("Mars/Olympus")).toThrow(
        'Invalid timezone "Mars/Olympus"'
      );
    });

    it("throws for excessively long string", () => {
      expect(() => RestaurantTimezone.create("A".repeat(51))).toThrow(
        "Restaurant timezone cannot exceed 50 characters"
      );
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const tz = RestaurantTimezone.reconstitute("Europe/Paris");
      expect(tz.value).toBe("Europe/Paris");
    });
  });

  describe("equals", () => {
    it("returns true for equal timezones", () => {
      const a = RestaurantTimezone.create("Europe/London");
      const b = RestaurantTimezone.create("Europe/London");
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different timezones", () => {
      const a = RestaurantTimezone.create("Europe/London");
      const b = RestaurantTimezone.create("Europe/Paris");
      expect(a.equals(b)).toBe(false);
    });
  });
});
