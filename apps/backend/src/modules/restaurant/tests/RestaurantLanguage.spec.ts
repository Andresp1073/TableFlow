import { describe, it, expect } from "vitest";
import { RestaurantLanguage } from "../domain/models/RestaurantLanguage.js";

describe("RestaurantLanguage", () => {
  describe("create", () => {
    it("creates from a valid language code", () => {
      const lang = RestaurantLanguage.create("en");
      expect(lang.value).toBe("en");
    });

    it("accepts language with region", () => {
      const lang = RestaurantLanguage.create("en-US");
      expect(lang.value).toBe("en-US");
    });

    it("throws for invalid format", () => {
      expect(() => RestaurantLanguage.create("english")).toThrow(
        "Restaurant language must be a valid ISO 639-1 code"
      );
    });

    it("throws for unsupported language", () => {
      expect(() => RestaurantLanguage.create("xx")).toThrow(
        'Unsupported language "xx"'
      );
    });

    it("throws for empty string", () => {
      expect(() => RestaurantLanguage.create("")).toThrow(
        "Restaurant language must be a valid ISO 639-1 code"
      );
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const lang = RestaurantLanguage.reconstitute("es");
      expect(lang.value).toBe("es");
    });
  });

  describe("defaultEN", () => {
    it("returns en", () => {
      expect(RestaurantLanguage.defaultEN().value).toBe("en");
    });
  });

  describe("equals", () => {
    it("returns true for equal languages", () => {
      const a = RestaurantLanguage.create("fr");
      const b = RestaurantLanguage.create("fr");
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different languages", () => {
      const a = RestaurantLanguage.create("fr");
      const b = RestaurantLanguage.create("de");
      expect(a.equals(b)).toBe(false);
    });
  });
});
