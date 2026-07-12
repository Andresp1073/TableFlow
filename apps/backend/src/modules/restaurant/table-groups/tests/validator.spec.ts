import { describe, it, expect } from "vitest";
import { TableGroupValidator } from "../application/validators/TableGroupValidator.js";

const validator = new TableGroupValidator();

describe("TableGroupValidator", () => {
  describe("validateCreateRequest", () => {
    const validRequest = {
      restaurantId: "rest-1",
      name: "Test Group",
      tableIds: ["table-1", "table-2"],
    };

    it("passes for valid request", () => {
      expect(() => validator.validateCreateRequest(validRequest)).not.toThrow();
    });

    it("throws when restaurantId is missing", () => {
      expect(() => validator.validateCreateRequest({ ...validRequest, restaurantId: "" }))
        .toThrow("restaurantId is required");
    });

    it("throws when name is missing", () => {
      expect(() => validator.validateCreateRequest({ ...validRequest, name: "" }))
        .toThrow("name is required");
    });

    it("throws when name exceeds 100 characters", () => {
      expect(() => validator.validateCreateRequest({ ...validRequest, name: "a".repeat(101) }))
        .toThrow("must not exceed 100 characters");
    });

    it("throws when tableIds has less than 2 items", () => {
      expect(() => validator.validateCreateRequest({ ...validRequest, tableIds: ["table-1"] }))
        .toThrow("At least 2 table IDs");
    });

    it("throws when tableIds has duplicates", () => {
      expect(() => validator.validateCreateRequest({ ...validRequest, tableIds: ["table-1", "table-1"] }))
        .toThrow("Duplicate table IDs");
    });
  });

  describe("validateUpdateRequest", () => {
    it("passes for empty request (no fields to update)", () => {
      expect(() => validator.validateUpdateRequest({})).not.toThrow();
    });

    it("passes with valid name", () => {
      expect(() => validator.validateUpdateRequest({ name: "Updated Group" })).not.toThrow();
    });

    it("throws when name is empty", () => {
      expect(() => validator.validateUpdateRequest({ name: "" }))
        .toThrow("name must not be empty");
    });

    it("throws when name exceeds 100 characters", () => {
      expect(() => validator.validateUpdateRequest({ name: "a".repeat(101) }))
        .toThrow("must not exceed 100 characters");
    });

    it("throws when tableIds has less than 2 items", () => {
      expect(() => validator.validateUpdateRequest({ tableIds: ["table-1"] }))
        .toThrow("At least 2 table IDs");
    });

    it("throws when tableIds has duplicates", () => {
      expect(() => validator.validateUpdateRequest({ tableIds: ["table-1", "table-1"] }))
        .toThrow("Duplicate table IDs");
    });
  });
});
