import { describe, it, expect } from "vitest";
import { RestaurantArchivePolicy } from "../domain/services/RestaurantArchivePolicy.js";
import type { Restaurant } from "../domain/models/Restaurant.js";
import { RestaurantName } from "../domain/models/RestaurantName.js";
import { RestaurantSlug } from "../domain/models/RestaurantSlug.js";
import { RestaurantStatus } from "../domain/models/RestaurantStatus.js";
import { RestaurantTimezone } from "../domain/models/RestaurantTimezone.js";
import { RestaurantCurrency } from "../domain/models/RestaurantCurrency.js";
import { RestaurantLanguage } from "../domain/models/RestaurantLanguage.js";

function createBaseRestaurant(overrides?: Partial<Restaurant>): Restaurant {
  const now = new Date();
  return {
    id: "test-id",
    name: RestaurantName.create("Test"),
    slug: RestaurantSlug.create("test"),
    legalName: null,
    taxId: null,
    email: null,
    phone: null,
    website: null,
    logoUrl: null,
    address: null,
    status: RestaurantStatus.draft(),
    timezone: RestaurantTimezone.create("UTC"),
    currency: RestaurantCurrency.create("USD"),
    language: RestaurantLanguage.create("en"),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}

describe("RestaurantArchivePolicy", () => {
  const policy = new RestaurantArchivePolicy();

  describe("assertCanArchive", () => {
    it("allows archiving draft restaurant", () => {
      const restaurant = createBaseRestaurant();
      expect(() => policy.assertCanArchive(restaurant)).not.toThrow();
    });

    it("allows archiving inactive restaurant", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.inactive() });
      expect(() => policy.assertCanArchive(restaurant)).not.toThrow();
    });

    it("rejects archiving active restaurant", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.active() });
      expect(() => policy.assertCanArchive(restaurant)).toThrow(
        "Only draft or inactive restaurants can be archived"
      );
    });

    it("rejects archiving pending restaurant", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.pending() });
      expect(() => policy.assertCanArchive(restaurant)).toThrow(
        "Only draft or inactive restaurants can be archived"
      );
    });

    it("rejects archiving suspended restaurant", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.suspended() });
      expect(() => policy.assertCanArchive(restaurant)).toThrow(
        "Only draft or inactive restaurants can be archived"
      );
    });

    it("rejects archiving already archived restaurant", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.archived() });
      expect(() => policy.assertCanArchive(restaurant)).toThrow(
        "Restaurant is already archived"
      );
    });

    it("rejects archiving already deleted restaurant", () => {
      const restaurant = createBaseRestaurant({ deletedAt: new Date() });
      expect(() => policy.assertCanArchive(restaurant)).toThrow(
        "already archived (deleted)"
      );
    });

    it("includes deactivation hint in error message", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.active() });
      expect(() => policy.assertCanArchive(restaurant)).toThrow(
        "Deactivate the restaurant before archiving"
      );
    });
  });

  describe("assertCanSoftDelete", () => {
    it("allows soft deleting archived restaurant", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.archived() });
      expect(() => policy.assertCanSoftDelete(restaurant)).not.toThrow();
    });

    it("rejects soft deleting non-archived restaurant", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.inactive() });
      expect(() => policy.assertCanSoftDelete(restaurant)).toThrow(
        "Restaurant must be archived before soft deletion"
      );
    });

    it("rejects soft deleting already deleted restaurant", () => {
      const restaurant = createBaseRestaurant({
        status: RestaurantStatus.archived(),
        deletedAt: new Date(),
      });
      expect(() => policy.assertCanSoftDelete(restaurant)).toThrow(
        "Restaurant is already deleted"
      );
    });
  });

  describe("assertNotDeleted", () => {
    it("passes when deletedAt is null", () => {
      expect(() => policy.assertNotDeleted({ deletedAt: null })).not.toThrow();
    });

    it("throws when deletedAt is set", () => {
      expect(() => policy.assertNotDeleted({ deletedAt: new Date() })).toThrow(
        "Restaurant is deleted"
      );
    });
  });

  describe("prepareSoftDelete", () => {
    it("returns deletedAt and deletedBy for valid deletion", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.archived() });
      const result = policy.prepareSoftDelete(restaurant, "user-123");

      expect(result.deletedAt).toBeInstanceOf(Date);
      expect(result.deletedBy).toBe("user-123");
    });

    it("rejects deletion of non-archived restaurant", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.draft() });
      expect(() => policy.prepareSoftDelete(restaurant, "user-123")).toThrow(
        "Restaurant must be archived before soft deletion"
      );
    });
  });
});
