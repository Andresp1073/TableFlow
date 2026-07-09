import { describe, it, expect } from "vitest";
import type { Restaurant } from "../domain/models/Restaurant.js";
import { RestaurantName } from "../domain/models/RestaurantName.js";
import { RestaurantSlug } from "../domain/models/RestaurantSlug.js";
import { RestaurantStatus } from "../domain/models/RestaurantStatus.js";
import { RestaurantTimezone } from "../domain/models/RestaurantTimezone.js";
import { RestaurantCurrency } from "../domain/models/RestaurantCurrency.js";
import { RestaurantLanguage } from "../domain/models/RestaurantLanguage.js";
import { RestaurantEmail } from "../domain/models/RestaurantEmail.js";
import { RestaurantTaxId } from "../domain/models/RestaurantTaxId.js";
import { RestaurantPhone } from "../domain/models/RestaurantPhone.js";

describe("Restaurant entity interface", () => {
  it("can be constructed with correct shape", () => {
    const now = new Date();
    const restaurant: Restaurant = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: RestaurantName.create("My Restaurant"),
      slug: RestaurantSlug.create("my-restaurant"),
      legalName: "My Restaurant LLC",
      taxId: RestaurantTaxId.create("12-3456789"),
      email: RestaurantEmail.create("contact@myrestaurant.com"),
      phone: RestaurantPhone.create("+1234567890"),
      website: "https://myrestaurant.com",
      logoUrl: "https://cdn.example.com/logo.png",
      address: "123 Main St",
      status: RestaurantStatus.active(),
      timezone: RestaurantTimezone.create("America/New_York"),
      currency: RestaurantCurrency.create("USD"),
      language: RestaurantLanguage.create("en"),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      deletedBy: null,
    };

    expect(restaurant.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(restaurant.name.value).toBe("My Restaurant");
    expect(restaurant.slug.value).toBe("my-restaurant");
    expect(restaurant.taxId?.value).toBe("12-3456789");
    expect(restaurant.email?.value).toBe("contact@myrestaurant.com");
    expect(restaurant.phone?.value).toBe("+1234567890");
    expect(restaurant.status.isActive()).toBe(true);
    expect(restaurant.deletedAt).toBeNull();
    expect(restaurant.deletedBy).toBeNull();
  });

  it("allows nullable fields to be null", () => {
    const now = new Date();
    const restaurant: Restaurant = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: RestaurantName.create("Minimal"),
      slug: RestaurantSlug.create("minimal"),
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
    };

    expect(restaurant.legalName).toBeNull();
    expect(restaurant.taxId).toBeNull();
    expect(restaurant.email).toBeNull();
    expect(restaurant.website).toBeNull();
    expect(restaurant.deletedBy).toBeNull();
  });

  it("reflects the default status as draft", () => {
    const now = new Date();
    const restaurant: Restaurant = {
      id: "...",
      name: RestaurantName.create("New"),
      slug: RestaurantSlug.create("new"),
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
    };

    expect(restaurant.status.isDraft()).toBe(true);
    expect(restaurant.status.canTransitionTo("pending")).toBe(true);
  });
});
