import { describe, it, expect } from "vitest";
import { RestaurantCurrency } from "../domain/models/RestaurantCurrency.js";

describe("RestaurantCurrency", () => {
  describe("create", () => {
    it("creates from a valid currency code", () => {
      const currency = RestaurantCurrency.create("USD");
      expect(currency.value).toBe("USD");
    });

    it("normalizes to uppercase", () => {
      const currency = RestaurantCurrency.create("usd");
      expect(currency.value).toBe("USD");
    });

    it("trims whitespace", () => {
      const currency = RestaurantCurrency.create("  eur  ");
      expect(currency.value).toBe("EUR");
    });

    it("throws for invalid format", () => {
      expect(() => RestaurantCurrency.create("US")).toThrow(
        "Restaurant currency must be a 3-letter ISO 4217 code"
      );
    });

    it("throws for lowercase invalid format", () => {
      expect(() => RestaurantCurrency.create("usd")).not.toThrow();
    });

    it("throws for unsupported currency", () => {
      expect(() => RestaurantCurrency.create("XYZ")).toThrow(
        'Unsupported currency "XYZ"'
      );
    });

    it("throws for empty string", () => {
      expect(() => RestaurantCurrency.create("")).toThrow(
        "Restaurant currency must be a 3-letter ISO 4217 code"
      );
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const currency = RestaurantCurrency.reconstitute("EUR");
      expect(currency.value).toBe("EUR");
    });

    it("normalizes to uppercase during reconstitute", () => {
      const currency = RestaurantCurrency.reconstitute("eur");
      expect(currency.value).toBe("EUR");
    });
  });

  describe("defaultUSD", () => {
    it("returns USD", () => {
      expect(RestaurantCurrency.defaultUSD().value).toBe("USD");
    });
  });

  describe("equals", () => {
    it("returns true for equal currencies", () => {
      const a = RestaurantCurrency.create("GBP");
      const b = RestaurantCurrency.create("GBP");
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different currencies", () => {
      const a = RestaurantCurrency.create("GBP");
      const b = RestaurantCurrency.create("EUR");
      expect(a.equals(b)).toBe(false);
    });
  });
});
