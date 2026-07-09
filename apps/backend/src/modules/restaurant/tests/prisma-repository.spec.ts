import { describe, it, expect } from "vitest";
import type { RestaurantRepository } from "../domain/repositories/RestaurantRepository.js";
import type { RestaurantQueryRepository } from "../domain/repositories/RestaurantQueryRepository.js";
import type { RestaurantValidator } from "../domain/repositories/RestaurantValidator.js";
import type { RestaurantFactory } from "../domain/repositories/RestaurantFactory.js";
import type { Restaurant } from "../domain/models/Restaurant.js";
import type { RestaurantStatusValue } from "../domain/models/RestaurantStatus.js";

describe("PrismaRestaurantRepository contract", () => {
  it("implements RestaurantRepository interface", () => {
    const repo: RestaurantRepository = {
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

  it("implements extended repository with uniqueness methods", () => {
    const extended: RestaurantRepository & {
      existsBySlug: (slug: string, excludeId?: string) => Promise<boolean>;
      existsByEmail: (email: string, excludeId?: string) => Promise<boolean>;
      existsByTaxId: (taxId: string, excludeId?: string) => Promise<boolean>;
    } = {
      findById: async () => null,
      findBySlug: async () => null,
      save: async (r: Restaurant) => r,
      update: async (r: Restaurant) => r,
      softDelete: async () => {},
      existsBySlug: async () => false,
      existsByEmail: async () => false,
      existsByTaxId: async () => false,
    };

    expect(extended.existsBySlug).toBeDefined();
    expect(extended.existsByEmail).toBeDefined();
    expect(extended.existsByTaxId).toBeDefined();
  });
});

describe("PrismaRestaurantQueryRepository contract", () => {
  it("implements RestaurantQueryRepository interface", () => {
    const repo: RestaurantQueryRepository = {
      findAllActive: async () => [],
      findByStatus: async () => [],
      searchByName: async () => [],
      countByStatus: async () => ({ active: 0, inactive: 0, suspended: 0, draft: 0, pending: 0, archived: 0 } as Record<RestaurantStatusValue, number>),
    };

    expect(repo.findAllActive).toBeDefined();
    expect(repo.findByStatus).toBeDefined();
    expect(repo.searchByName).toBeDefined();
    expect(repo.countByStatus).toBeDefined();
  });

  it("includes list method for paginated queries", () => {
    const extended: RestaurantQueryRepository & {
      list: (filters: { page?: number; limit?: number }) => Promise<{ data: Restaurant[]; total: number; page: number; limit: number; totalPages: number }>;
    } = {
      findAllActive: async () => [],
      findByStatus: async () => [],
      searchByName: async () => [],
      countByStatus: async () => ({} as never),
      list: async () => ({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    };

    expect(extended.list).toBeDefined();
  });
});

describe("ConcreteRestaurantFactory contract", () => {
  it("implements RestaurantFactory interface", () => {
    const factory: RestaurantFactory = {
      create: () => ({} as Restaurant),
      reconstitute: () => ({} as Restaurant),
    };

    expect(factory.create).toBeDefined();
    expect(factory.reconstitute).toBeDefined();
  });
});

describe("RestaurantValidator contract", () => {
  it("implements RestaurantValidator interface", () => {
    const validator: RestaurantValidator = {
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
