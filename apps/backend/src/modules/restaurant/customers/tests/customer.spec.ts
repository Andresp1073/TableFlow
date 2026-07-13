import { describe, it, expect, vi } from "vitest";
import { CustomerName } from "../domain/models/CustomerName.js";
import { CustomerEmail } from "../domain/models/CustomerEmail.js";
import { CustomerPhone } from "../domain/models/CustomerPhone.js";
import { CustomerStatus } from "../domain/models/CustomerStatus.js";
import { PreferredLanguage } from "../domain/models/PreferredLanguage.js";
import { CustomerValidationPolicy } from "../domain/services/CustomerValidationPolicy.js";
import { CustomerDuplicatePolicy } from "../domain/services/CustomerDuplicatePolicy.js";
import { DuplicateCustomerError } from "../errors/DuplicateCustomerError.js";
import { CustomerValidationError } from "../errors/CustomerValidationError.js";

describe("CustomerName", () => {
  it("creates valid name", () => {
    const name = CustomerName.create("John", "Doe");
    expect(name.firstName).toBe("John");
    expect(name.lastName).toBe("Doe");
  });

  it("trims whitespace", () => {
    const name = CustomerName.create("  John  ", "  Doe  ");
    expect(name.firstName).toBe("John");
    expect(name.lastName).toBe("Doe");
  });

  it("throws for empty first name", () => {
    expect(() => CustomerName.create("", "Doe")).toThrow();
    expect(() => CustomerName.create("   ", "Doe")).toThrow();
  });

  it("throws for empty last name", () => {
    expect(() => CustomerName.create("John", "")).toThrow();
    expect(() => CustomerName.create("John", "   ")).toThrow();
  });

  it("throws for too long names", () => {
    expect(() => CustomerName.create("a".repeat(101), "Doe")).toThrow();
    expect(() => CustomerName.create("John", "a".repeat(101))).toThrow();
  });

  it("returns full name", () => {
    const name = CustomerName.create("John", "Doe");
    expect(name.getFullName()).toBe("John Doe");
  });

  it("compares case-insensitively", () => {
    expect(
      CustomerName.create("John", "Doe").equals(CustomerName.create("john", "doe")),
    ).toBe(true);
  });

  it("reconstitutes from stored values", () => {
    const name = CustomerName.reconstitute("John", "Doe");
    expect(name.firstName).toBe("John");
    expect(name.lastName).toBe("Doe");
  });
});

describe("CustomerEmail", () => {
  it("creates valid email", () => {
    const email = CustomerEmail.create("john@example.com");
    expect(email.value).toBe("john@example.com");
  });

  it("normalizes to lowercase", () => {
    const email = CustomerEmail.create("John@Example.COM");
    expect(email.value).toBe("john@example.com");
  });

  it("trims whitespace", () => {
    const email = CustomerEmail.create("  john@example.com  ");
    expect(email.value).toBe("john@example.com");
  });

  it("throws for empty string", () => {
    expect(() => CustomerEmail.create("")).toThrow();
  });

  it("throws for invalid format", () => {
    expect(() => CustomerEmail.create("not-an-email")).toThrow();
    expect(() => CustomerEmail.create("@example.com")).toThrow();
    expect(() => CustomerEmail.create("john@")).toThrow();
  });

  it("throws for too long", () => {
    expect(() => CustomerEmail.create("a".repeat(255) + "@b.com")).toThrow();
  });

  it("reconstitutes from stored value", () => {
    const email = CustomerEmail.reconstitute("john@example.com");
    expect(email.value).toBe("john@example.com");
  });
});

describe("CustomerPhone", () => {
  it("creates valid phone numbers", () => {
    expect(CustomerPhone.create("+1234567890").value).toBe("+1234567890");
    expect(CustomerPhone.create("1234567890").value).toBe("1234567890");
  });

  it("strips formatting characters", () => {
    const phone = CustomerPhone.create("+1 (555) 123-4567");
    expect(phone.value).toBe("+15551234567");
  });

  it("throws for empty string", () => {
    expect(() => CustomerPhone.create("")).toThrow();
    expect(() => CustomerPhone.create("   ")).toThrow();
  });

  it("throws for too short", () => {
    expect(() => CustomerPhone.create("123")).toThrow();
  });

  it("throws for invalid characters", () => {
    expect(() => CustomerPhone.create("abc")).toThrow();
  });

  it("reconstitutes from stored value", () => {
    const phone = CustomerPhone.reconstitute("+1234567890");
    expect(phone.value).toBe("+1234567890");
  });
});

describe("CustomerStatus", () => {
  const validStatuses = ["active", "inactive", "blocked", "archived"];

  it("creates valid statuses", () => {
    for (const status of validStatuses) {
      expect(CustomerStatus.create(status).value).toBe(status);
    }
  });

  it("throws for invalid status", () => {
    expect(() => CustomerStatus.create("invalid")).toThrow();
    expect(() => CustomerStatus.create("")).toThrow();
  });

  it("normalizes whitespace and case", () => {
    expect(CustomerStatus.create("  ACTIVE  ").value).toBe("active");
  });

  it("validates active transitions", () => {
    const active = CustomerStatus.create("active");
    expect(active.isTransitionValid("inactive")).toBe(true);
    expect(active.isTransitionValid("blocked")).toBe(true);
    expect(active.isTransitionValid("archived")).toBe(true);
    expect(active.isTransitionValid("active")).toBe(false);
  });

  it("validates inactive transitions", () => {
    const inactive = CustomerStatus.create("inactive");
    expect(inactive.isTransitionValid("active")).toBe(true);
    expect(inactive.isTransitionValid("archived")).toBe(true);
    expect(inactive.isTransitionValid("blocked")).toBe(false);
  });

  it("validates blocked transitions", () => {
    const blocked = CustomerStatus.create("blocked");
    expect(blocked.isTransitionValid("active")).toBe(true);
    expect(blocked.isTransitionValid("archived")).toBe(true);
    expect(blocked.isTransitionValid("inactive")).toBe(false);
  });

  it("archived is terminal", () => {
    const archived = CustomerStatus.create("archived");
    expect(archived.isTerminal()).toBe(true);
    expect(archived.isTransitionValid("active")).toBe(false);
    expect(archived.isTransitionValid("inactive")).toBe(false);
    expect(archived.isTransitionValid("blocked")).toBe(false);
  });

  it("detects reservation eligibility", () => {
    expect(CustomerStatus.create("active").canMakeReservations()).toBe(true);
    expect(CustomerStatus.create("inactive").canMakeReservations()).toBe(false);
    expect(CustomerStatus.create("blocked").canMakeReservations()).toBe(false);
    expect(CustomerStatus.create("archived").canMakeReservations()).toBe(false);
  });

  it("checks specific status helpers", () => {
    expect(CustomerStatus.create("active").isActive()).toBe(true);
    expect(CustomerStatus.create("blocked").isBlocked()).toBe(true);
    expect(CustomerStatus.create("archived").isArchived()).toBe(true);
  });
});

describe("PreferredLanguage", () => {
  it("creates valid languages", () => {
    expect(PreferredLanguage.create("en").value).toBe("en");
    expect(PreferredLanguage.create("es").value).toBe("es");
    expect(PreferredLanguage.create("fr").value).toBe("fr");
  });

  it("normalizes case", () => {
    expect(PreferredLanguage.create("EN").value).toBe("en");
  });

  it("throws for invalid language", () => {
    expect(() => PreferredLanguage.create("xx")).toThrow();
    expect(() => PreferredLanguage.create("")).toThrow();
  });

  it("reconstitutes from stored value", () => {
    expect(PreferredLanguage.reconstitute("en").value).toBe("en");
  });
});

describe("CustomerValidationPolicy", () => {
  const policy = new CustomerValidationPolicy();

  it("passes when email is provided", () => {
    expect(() =>
      policy.validateContactMethod({
        email: CustomerEmail.create("john@example.com"),
        phone: null,
      }),
    ).not.toThrow();
  });

  it("passes when phone is provided", () => {
    expect(() =>
      policy.validateContactMethod({
        email: null,
        phone: CustomerPhone.create("+1234567890"),
      }),
    ).not.toThrow();
  });

  it("passes when both are provided", () => {
    expect(() =>
      policy.validateContactMethod({
        email: CustomerEmail.create("john@example.com"),
        phone: CustomerPhone.create("+1234567890"),
      }),
    ).not.toThrow();
  });

  it("throws when neither email nor phone", () => {
    expect(() =>
      policy.validateContactMethod({ email: null, phone: null }),
    ).toThrow(CustomerValidationError);
  });

  it("returns valid result for creation with email", () => {
    const result = policy.validateForCreation({
      email: CustomerEmail.create("john@example.com"),
      phone: null,
    });
    expect(result.isValid).toBe(true);
  });

  it("returns invalid result for creation without contact", () => {
    const result = policy.validateForCreation({ email: null, phone: null });
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });
});

describe("CustomerDuplicatePolicy", () => {
  it("throws DuplicateCustomerError when email exists", async () => {
    const mockRepo = {
      findByEmailAndRestaurant: vi.fn().mockResolvedValue({ id: "existing" }),
      findByPhoneAndRestaurant: vi.fn().mockResolvedValue(null),
    } as any;

    const policy = new CustomerDuplicatePolicy(mockRepo);
    const email = CustomerEmail.create("existing@example.com");

    await expect(policy.checkEmail(email, "rest-1")).rejects.toThrow(DuplicateCustomerError);
  });

  it("passes when email is unique", async () => {
    const mockRepo = {
      findByEmailAndRestaurant: vi.fn().mockResolvedValue(null),
      findByPhoneAndRestaurant: vi.fn().mockResolvedValue(null),
    } as any;

    const policy = new CustomerDuplicatePolicy(mockRepo);
    const email = CustomerEmail.create("new@example.com");

    await expect(policy.checkEmail(email, "rest-1")).resolves.toBeUndefined();
  });

  it("throws DuplicateCustomerError when phone exists", async () => {
    const mockRepo = {
      findByEmailAndRestaurant: vi.fn().mockResolvedValue(null),
      findByPhoneAndRestaurant: vi.fn().mockResolvedValue({ id: "existing" }),
    } as any;

    const policy = new CustomerDuplicatePolicy(mockRepo);
    const phone = CustomerPhone.create("+1234567890");

    await expect(policy.checkPhone(phone, "rest-1")).rejects.toThrow(DuplicateCustomerError);
  });

  it("returns duplicates from checkForCreation", async () => {
    const mockRepo = {
      findByEmailAndRestaurant: vi.fn().mockResolvedValue({ id: "existing" }),
      findByPhoneAndRestaurant: vi.fn().mockResolvedValue(null),
    } as any;

    const policy = new CustomerDuplicatePolicy(mockRepo);
    const email = CustomerEmail.create("existing@example.com");

    const result = await policy.checkForCreation(email, null, "rest-1");
    expect(result.hasDuplicates).toBe(true);
    expect(result.duplicateFields).toContain("email");
  });

  it("returns no duplicates when all unique", async () => {
    const mockRepo = {
      findByEmailAndRestaurant: vi.fn().mockResolvedValue(null),
      findByPhoneAndRestaurant: vi.fn().mockResolvedValue(null),
    } as any;

    const policy = new CustomerDuplicatePolicy(mockRepo);
    const email = CustomerEmail.create("new@example.com");
    const phone = CustomerPhone.create("+1234567890");

    const result = await policy.checkForCreation(email, phone, "rest-1");
    expect(result.hasDuplicates).toBe(false);
    expect(result.duplicateFields).toHaveLength(0);
  });
});
