import { describe, it, expect } from "vitest";
import { RestaurantActivationPolicy } from "../domain/services/RestaurantActivationPolicy.js";
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

describe("RestaurantActivationPolicy", () => {
  const policy = new RestaurantActivationPolicy();

  describe("assertCanSubmitForReview", () => {
    it("allows draft with all required fields", () => {
      const restaurant = createBaseRestaurant();
      expect(() => policy.assertCanSubmitForReview(restaurant)).not.toThrow();
    });

    it("rejects non-draft restaurants", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.pending() });
      expect(() => policy.assertCanSubmitForReview(restaurant)).toThrow(
        "Only draft restaurants can be submitted for review"
      );
    });

    it("rejects draft missing name", () => {
      const restaurant = createBaseRestaurant({ name: null as unknown as RestaurantName });
      expect(() => policy.assertCanSubmitForReview(restaurant)).toThrow(
        "Missing required fields: name"
      );
    });

    it("rejects draft missing slug", () => {
      const restaurant = createBaseRestaurant({ slug: null as unknown as RestaurantSlug });
      expect(() => policy.assertCanSubmitForReview(restaurant)).toThrow(
        "Missing required fields: slug"
      );
    });

    it("rejects draft missing timezone", () => {
      const restaurant = createBaseRestaurant({ timezone: null as unknown as RestaurantTimezone });
      expect(() => policy.assertCanSubmitForReview(restaurant)).toThrow(
        "Missing required fields: timezone"
      );
    });
  });

  describe("assertCanApprove", () => {
    it("allows approving pending restaurant", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.pending() });
      expect(() => policy.assertCanApprove(restaurant)).not.toThrow();
    });

    it("rejects approving non-pending restaurant", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.draft() });
      expect(() => policy.assertCanApprove(restaurant)).toThrow(
        "Only pending restaurants can be approved"
      );
    });
  });

  describe("assertCanReject", () => {
    it("allows rejecting pending restaurant", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.pending() });
      expect(() => policy.assertCanReject(restaurant)).not.toThrow();
    });

    it("rejects rejecting non-pending restaurant", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.active() });
      expect(() => policy.assertCanReject(restaurant)).toThrow(
        "Only pending restaurants can be rejected"
      );
    });
  });

  describe("assertCanReactivate", () => {
    it("allows reactivating inactive restaurant", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.inactive() });
      expect(() => policy.assertCanReactivate(restaurant)).not.toThrow();
    });

    it("allows reactivating suspended restaurant", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.suspended() });
      expect(() => policy.assertCanReactivate(restaurant)).not.toThrow();
    });

    it("rejects reactivating active restaurant", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.active() });
      expect(() => policy.assertCanReactivate(restaurant)).toThrow(
        "Only inactive or suspended restaurants can be reactivated"
      );
    });

    it("rejects reactivating draft restaurant", () => {
      const restaurant = createBaseRestaurant({ status: RestaurantStatus.draft() });
      expect(() => policy.assertCanReactivate(restaurant)).toThrow(
        "Only inactive or suspended restaurants can be reactivated"
      );
    });
  });

  describe("checkPrerequisites", () => {
    it("returns all true when fields are filled", () => {
      const restaurant = createBaseRestaurant();
      const result = policy.checkPrerequisites(restaurant);

      expect(result.nameFilled).toBe(true);
      expect(result.slugFilled).toBe(true);
      expect(result.timezoneValid).toBe(true);
      expect(result.currencyValid).toBe(true);
      expect(result.languageValid).toBe(true);
    });
  });
});
