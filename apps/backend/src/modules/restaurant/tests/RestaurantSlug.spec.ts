import { describe, it, expect } from "vitest";
import { RestaurantSlug } from "../domain/models/RestaurantSlug.js";

describe("RestaurantSlug", () => {
  describe("create", () => {
    it("creates from a valid slug", () => {
      const slug = RestaurantSlug.create("my-restaurant");
      expect(slug.value).toBe("my-restaurant");
    });

    it("normalizes to lowercase", () => {
      const slug = RestaurantSlug.create("My-Restaurant");
      expect(slug.value).toBe("my-restaurant");
    });

    it("trims whitespace", () => {
      const slug = RestaurantSlug.create("  my-restaurant  ");
      expect(slug.value).toBe("my-restaurant");
    });

    it("allows numbers", () => {
      const slug = RestaurantSlug.create("restaurant-123");
      expect(slug.value).toBe("restaurant-123");
    });

    it("throws for empty string", () => {
      expect(() => RestaurantSlug.create("")).toThrow("Restaurant slug cannot be empty");
    });

    it("throws for slug exceeding 100 characters", () => {
      expect(() => RestaurantSlug.create("a" + "-b".repeat(50))).toThrow(
        "Restaurant slug cannot exceed 100 characters"
      );
    });

    it("throws for uppercase letters", () => {
      expect(() => RestaurantSlug.create("My-Restaurant")).not.toThrow();
      const slug = RestaurantSlug.create("My-Restaurant");
      expect(slug.value).toBe("my-restaurant");
    });

    it("throws for underscores", () => {
      expect(() => RestaurantSlug.create("my_restaurant")).toThrow(
        /must contain only lowercase letters/
      );
    });

    it("throws for leading hyphen", () => {
      expect(() => RestaurantSlug.create("-my-restaurant")).toThrow(
        /must contain only lowercase letters/
      );
    });

    it("throws for trailing hyphen", () => {
      expect(() => RestaurantSlug.create("my-restaurant-")).toThrow(
        /must contain only lowercase letters/
      );
    });

    it("throws for double hyphens", () => {
      expect(() => RestaurantSlug.create("my--restaurant")).toThrow(
        /must contain only lowercase letters/
      );
    });

    it("throws for spaces", () => {
      expect(() => RestaurantSlug.create("my restaurant")).toThrow(
        /must contain only lowercase letters/
      );
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const slug = RestaurantSlug.reconstitute("existing-slug");
      expect(slug.value).toBe("existing-slug");
    });
  });

  describe("equals", () => {
    it("returns true for equal slugs", () => {
      const a = RestaurantSlug.create("my-place");
      const b = RestaurantSlug.create("my-place");
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different slugs", () => {
      const a = RestaurantSlug.create("my-place");
      const b = RestaurantSlug.create("other-place");
      expect(a.equals(b)).toBe(false);
    });
  });
});
