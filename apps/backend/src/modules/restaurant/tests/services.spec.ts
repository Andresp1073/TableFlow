import { describe, it, expect } from "vitest";
import type { Restaurant } from "../domain/models/Restaurant.js";
import type { RestaurantStatusValue } from "../domain/models/RestaurantStatus.js";

describe("RestaurantDomainService contract", () => {
  it("defines expected method signatures", () => {
    const svc: import("../domain/services/RestaurantDomainService.js").RestaurantDomainService = {
      submitForReview: async (r: Restaurant) => r,
      approve: async (r: Restaurant) => r,
      reject: async (r: Restaurant) => r,
      activate: async (r: Restaurant) => r,
      deactivate: async (r: Restaurant) => r,
      suspend: async (r: Restaurant, _reason?: string) => r,
      unsuspend: async (r: Restaurant) => r,
      archive: async (r: Restaurant) => r,
      transferOwnership: async () => {},
    };

    expect(svc.submitForReview).toBeDefined();
    expect(svc.approve).toBeDefined();
    expect(svc.reject).toBeDefined();
    expect(svc.activate).toBeDefined();
    expect(svc.deactivate).toBeDefined();
    expect(svc.suspend).toBeDefined();
    expect(svc.unsuspend).toBeDefined();
    expect(svc.archive).toBeDefined();
    expect(svc.transferOwnership).toBeDefined();
  });
});

describe("RestaurantValidationService contract", () => {
  it("defines expected method signatures", () => {
    const svc: import("../domain/services/RestaurantValidationService.js").RestaurantValidationService = {
      assertIsActive: () => {},
      assertNotDeleted: () => {},
      assertNotArchived: () => {},
      assertCanTransitionTo: () => {},
    };

    expect(svc.assertIsActive).toBeDefined();
    expect(svc.assertNotDeleted).toBeDefined();
    expect(svc.assertNotArchived).toBeDefined();
    expect(svc.assertCanTransitionTo).toBeDefined();
  });
});

describe("RestaurantSlugGenerator contract", () => {
  it("defines expected method signatures", () => {
    const svc: import("../domain/services/RestaurantSlugGenerator.js").RestaurantSlugGenerator = {
      fromName: async () => "my-slug",
      ensureUnique: async (s: string) => s,
    };

    expect(svc.fromName).toBeDefined();
    expect(svc.ensureUnique).toBeDefined();
  });
});
