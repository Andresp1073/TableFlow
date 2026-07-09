import { describe, it, expect } from "vitest";
import { RestaurantNotFoundError } from "../errors/RestaurantNotFoundError.js";
import { RestaurantAlreadyExistsError } from "../errors/RestaurantAlreadyExistsError.js";
import { RestaurantInactiveError } from "../errors/RestaurantInactiveError.js";
import { RestaurantSlugAlreadyExistsError } from "../errors/RestaurantSlugAlreadyExistsError.js";
import { InvalidRestaurantStateError } from "../errors/InvalidRestaurantStateError.js";
import { RestaurantArchivedError } from "../errors/RestaurantArchivedError.js";
import { RestaurantDuplicateError } from "../errors/RestaurantDuplicateError.js";

describe("Restaurant errors", () => {
  describe("RestaurantNotFoundError", () => {
    it("creates error with correct code and status", () => {
      const err = new RestaurantNotFoundError("abc-123");
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe("restaurant.not_found");
      expect(err.message).toContain("abc-123");
      expect(err.name).toBe("RestaurantNotFoundError");
    });
  });

  describe("RestaurantAlreadyExistsError", () => {
    it("creates error with correct code and status", () => {
      const err = new RestaurantAlreadyExistsError("slug", "my-place");
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe("restaurant.already_exists");
      expect(err.message).toContain("slug");
      expect(err.message).toContain("my-place");
      expect(err.name).toBe("RestaurantAlreadyExistsError");
    });
  });

  describe("RestaurantInactiveError", () => {
    it("creates error with correct code and status", () => {
      const err = new RestaurantInactiveError("abc-123");
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe("restaurant.inactive");
      expect(err.message).toContain("abc-123");
      expect(err.name).toBe("RestaurantInactiveError");
    });
  });

  describe("RestaurantSlugAlreadyExistsError", () => {
    it("creates error with correct code and status", () => {
      const err = new RestaurantSlugAlreadyExistsError("my-place");
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe("restaurant.slug_already_exists");
      expect(err.message).toContain("my-place");
      expect(err.name).toBe("RestaurantSlugAlreadyExistsError");
    });
  });

  describe("InvalidRestaurantStateError", () => {
    it("creates error with correct code and status", () => {
      const err = new InvalidRestaurantStateError("Cannot close a restaurant with active reservations");
      expect(err.statusCode).toBe(422);
      expect(err.code).toBe("restaurant.invalid_state");
      expect(err.message).toBe("Cannot close a restaurant with active reservations");
      expect(err.name).toBe("InvalidRestaurantStateError");
    });
  });

  describe("RestaurantArchivedError", () => {
    it("creates error with correct code and status", () => {
      const err = new RestaurantArchivedError("abc-123");
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe("restaurant.archived");
      expect(err.message).toContain("abc-123");
      expect(err.name).toBe("RestaurantArchivedError");
    });
  });

  describe("RestaurantDuplicateError", () => {
    it("creates error with correct code and status", () => {
      const err = new RestaurantDuplicateError("taxId", "12-3456789");
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe("restaurant.duplicate");
      expect(err.message).toContain("taxId");
      expect(err.message).toContain("12-3456789");
      expect(err.name).toBe("RestaurantDuplicateError");
    });
  });
});
