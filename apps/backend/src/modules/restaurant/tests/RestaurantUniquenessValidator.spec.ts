import { describe, it, expect, vi } from "vitest";
import { RestaurantUniquenessValidator } from "../domain/services/RestaurantUniquenessValidator.js";
import type { UniquenessRepository } from "../domain/services/RestaurantUniquenessValidator.js";
import { RestaurantSlug } from "../domain/models/RestaurantSlug.js";
import { RestaurantEmail } from "../domain/models/RestaurantEmail.js";
import { RestaurantTaxId } from "../domain/models/RestaurantTaxId.js";

function createRepo(overrides?: Partial<UniquenessRepository>): UniquenessRepository {
  return {
    isSlugTaken: async () => false,
    isEmailTaken: async () => false,
    isTaxIdTaken: async () => false,
    ...overrides,
  };
}

describe("RestaurantUniquenessValidator", () => {
  describe("assertSlugUnique", () => {
    it("passes when slug is available", async () => {
      const repo = createRepo({ isSlugTaken: async () => false });
      const validator = new RestaurantUniquenessValidator(repo);
      const slug = RestaurantSlug.create("my-place");

      await expect(validator.assertSlugUnique(slug)).resolves.toBeUndefined();
    });

    it("throws when slug is taken", async () => {
      const repo = createRepo({ isSlugTaken: async () => true });
      const validator = new RestaurantUniquenessValidator(repo);
      const slug = RestaurantSlug.create("my-place");

      await expect(validator.assertSlugUnique(slug)).rejects.toThrow(
        "is already taken"
      );
    });

    it("passes when slug is taken but excluded", async () => {
      const isSlugTaken = vi.fn().mockResolvedValue(false);
      const repo = createRepo({ isSlugTaken });
      const validator = new RestaurantUniquenessValidator(repo);
      const slug = RestaurantSlug.create("my-place");

      await validator.assertSlugUnique(slug, "exclude-id");
      expect(isSlugTaken).toHaveBeenCalledWith("my-place", "exclude-id");
    });
  });

  describe("assertEmailUnique", () => {
    it("passes when email is available", async () => {
      const repo = createRepo({ isEmailTaken: async () => false });
      const validator = new RestaurantUniquenessValidator(repo);
      const email = RestaurantEmail.create("contact@example.com");

      await expect(validator.assertEmailUnique(email)).resolves.toBeUndefined();
    });

    it("throws when email is taken", async () => {
      const repo = createRepo({ isEmailTaken: async () => true });
      const validator = new RestaurantUniquenessValidator(repo);
      const email = RestaurantEmail.create("contact@example.com");

      await expect(validator.assertEmailUnique(email)).rejects.toThrow(
        "already exists"
      );
    });
  });

  describe("assertTaxIdUnique", () => {
    it("passes when tax ID is available", async () => {
      const repo = createRepo({ isTaxIdTaken: async () => false });
      const validator = new RestaurantUniquenessValidator(repo);
      const taxId = RestaurantTaxId.create("12-3456789");

      await expect(validator.assertTaxIdUnique(taxId)).resolves.toBeUndefined();
    });

    it("throws when tax ID is taken", async () => {
      const repo = createRepo({ isTaxIdTaken: async () => true });
      const validator = new RestaurantUniquenessValidator(repo);
      const taxId = RestaurantTaxId.create("12-3456789");

      await expect(validator.assertTaxIdUnique(taxId)).rejects.toThrow(
        "already exists"
      );
    });
  });
});
