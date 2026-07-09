import { describe, it, expect } from "vitest";
import {
  validateRestaurantName,
  validateRestaurantSlug,
  validateRestaurantEmail,
  validateRestaurantTaxId,
  validateRestaurantPhone,
  validateRestaurantStatus,
  validateRestaurantForCreation,
} from "../domain/validation/RestaurantRules.js";

describe("validateRestaurantName", () => {
  it("returns null for valid name", () => {
    expect(validateRestaurantName("My Restaurant")).toBeNull();
  });

  it("returns error for null/undefined", () => {
    expect(validateRestaurantName(null)).toEqual({
      field: "name",
      message: "Restaurant name is required",
    });
    expect(validateRestaurantName(undefined)).toEqual({
      field: "name",
      message: "Restaurant name is required",
    });
  });

  it("returns error for non-string", () => {
    expect(validateRestaurantName(123)).toEqual({
      field: "name",
      message: "Restaurant name must be a string",
    });
  });

  it("returns error for empty", () => {
    const result = validateRestaurantName("");
    expect(result?.field).toBe("name");
  });
});

describe("validateRestaurantSlug", () => {
  it("returns null for valid slug", () => {
    expect(validateRestaurantSlug("my-place")).toBeNull();
  });

  it("returns error for null", () => {
    expect(validateRestaurantSlug(null)).toEqual({
      field: "slug",
      message: "Restaurant slug is required",
    });
  });
});

describe("validateRestaurantEmail", () => {
  it("returns null for valid email", () => {
    expect(validateRestaurantEmail("a@b.com")).toBeNull();
  });

  it("returns null for null/undefined (optional)", () => {
    expect(validateRestaurantEmail(null)).toBeNull();
    expect(validateRestaurantEmail(undefined)).toBeNull();
  });

  it("returns error for invalid email", () => {
    const result = validateRestaurantEmail("not-email");
    expect(result?.field).toBe("email");
  });
});

describe("validateRestaurantTaxId", () => {
  it("returns null for valid tax ID", () => {
    expect(validateRestaurantTaxId("12-3456789")).toBeNull();
  });

  it("returns null for null/undefined (optional)", () => {
    expect(validateRestaurantTaxId(null)).toBeNull();
    expect(validateRestaurantTaxId(undefined)).toBeNull();
  });

  it("returns error for too short", () => {
    const result = validateRestaurantTaxId("AB");
    expect(result?.field).toBe("taxId");
  });
});

describe("validateRestaurantPhone", () => {
  it("returns null for valid phone", () => {
    expect(validateRestaurantPhone("+1234567890")).toBeNull();
  });

  it("returns null for null/undefined (optional)", () => {
    expect(validateRestaurantPhone(null)).toBeNull();
  });

  it("returns error for too short", () => {
    const result = validateRestaurantPhone("123");
    expect(result?.field).toBe("phone");
  });
});

describe("validateRestaurantStatus", () => {
  it("returns null for valid status", () => {
    expect(validateRestaurantStatus("active")).toBeNull();
    expect(validateRestaurantStatus("draft")).toBeNull();
    expect(validateRestaurantStatus("archived")).toBeNull();
  });

  it("returns error for null", () => {
    expect(validateRestaurantStatus(null)).toEqual({
      field: "status",
      message: "Restaurant status is required",
    });
  });

  it("returns error for invalid status", () => {
    const result = validateRestaurantStatus("deleted");
    expect(result?.field).toBe("status");
  });
});

describe("validateRestaurantForCreation", () => {
  it("returns empty array for valid data", () => {
    const errors = validateRestaurantForCreation({
      name: "My Place",
      slug: "my-place",
    });
    expect(errors).toEqual([]);
  });

  it("returns errors for invalid data", () => {
    const errors = validateRestaurantForCreation({
      name: "",
      slug: "__INVALID__",
      email: "bad-email",
      taxId: "AB",
      phone: "123",
    });
    expect(errors.length).toBeGreaterThanOrEqual(2);
    expect(errors.find((e) => e.field === "name")).toBeDefined();
    expect(errors.find((e) => e.field === "slug")).toBeDefined();
  });
});
