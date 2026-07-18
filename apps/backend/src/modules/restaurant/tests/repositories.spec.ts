import { describe, it, expect } from "vitest";
import type { Restaurant } from "../domain/models/Restaurant.js";

describe("RestaurantRepository contract", () => {
  it("defines expected method signatures", () => {
    const repo: import("../domain/repositories/RestaurantRepository.js").RestaurantRepository = {
      findById: async () => null,
      findBySlug: async () => null,
      save: async (r: Restaurant) => r,
      update: async (r: Restaurant) => r,
      softDelete: async () => {},
    };

    expect(repo.findById).toBeDefined();
    expect(repo.findBySlug).toBeDefined();
    expect(repo.save).toBeDefined();
    expect(repo.update).toBeDefined();
    expect(repo.softDelete).toBeDefined();
  });
});

describe("RestaurantQueryRepository contract", () => {
  it("defines expected method signatures", () => {
    const repo: import("../domain/repositories/RestaurantQueryRepository.js").RestaurantQueryRepository = {
      findAllActive: async () => [],
      findByStatus: async () => [],
      searchByName: async () => [],
      countByStatus: async () => ({ active: 0, inactive: 0, suspended: 0, closing_down: 0 } as never),
    };

    expect(repo.findAllActive).toBeDefined();
    expect(repo.findByStatus).toBeDefined();
    expect(repo.searchByName).toBeDefined();
    expect(repo.countByStatus).toBeDefined();
  });
});

describe("RestaurantValidator contract", () => {
  it("defines expected method signatures", () => {
    const validator: import("../domain/repositories/RestaurantValidator.js").RestaurantValidator = {
      validateForCreation: async () => {},
      validateForUpdate: async () => {},
      ensureSlugIsUnique: async () => {},
      ensureEmailIsUnique: async () => {},
    };

    expect(validator.validateForCreation).toBeDefined();
    expect(validator.validateForUpdate).toBeDefined();
    expect(validator.ensureSlugIsUnique).toBeDefined();
    expect(validator.ensureEmailIsUnique).toBeDefined();
  });
});

describe("RestaurantFactory contract", () => {
  it("defines expected method signatures", () => {
    const factory: import("../domain/repositories/RestaurantFactory.js").RestaurantFactory = {
      create: () => ({} as Restaurant),
      reconstitute: () => ({} as Restaurant),
    };

    expect(factory.create).toBeDefined();
    expect(factory.reconstitute).toBeDefined();
  });
});
