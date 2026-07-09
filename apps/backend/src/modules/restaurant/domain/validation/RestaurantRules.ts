import { RestaurantName } from "../models/RestaurantName.js";
import { RestaurantSlug } from "../models/RestaurantSlug.js";
import { RestaurantEmail } from "../models/RestaurantEmail.js";
import { RestaurantTaxId } from "../models/RestaurantTaxId.js";
import { RestaurantPhone } from "../models/RestaurantPhone.js";
import type { RestaurantStatusValue } from "../models/RestaurantStatus.js";
import { RESTAURANT_STATUSES } from "../models/RestaurantStatus.js";

export interface ValidationError {
  field: string;
  message: string;
}

export function validateRestaurantName(name: unknown): ValidationError | null {
  if (name === null || name === undefined) {
    return { field: "name", message: "Restaurant name is required" };
  }

  if (typeof name !== "string") {
    return { field: "name", message: "Restaurant name must be a string" };
  }

  try {
    RestaurantName.create(name);
    return null;
  } catch (e) {
    return { field: "name", message: (e as Error).message };
  }
}

export function validateRestaurantSlug(slug: unknown): ValidationError | null {
  if (slug === null || slug === undefined) {
    return { field: "slug", message: "Restaurant slug is required" };
  }

  if (typeof slug !== "string") {
    return { field: "slug", message: "Restaurant slug must be a string" };
  }

  try {
    RestaurantSlug.create(slug);
    return null;
  } catch (e) {
    return { field: "slug", message: (e as Error).message };
  }
}

export function validateRestaurantEmail(email: unknown): ValidationError | null {
  if (email === null || email === undefined) {
    return null;
  }

  if (typeof email !== "string") {
    return { field: "email", message: "Restaurant email must be a string" };
  }

  try {
    RestaurantEmail.create(email);
    return null;
  } catch (e) {
    return { field: "email", message: (e as Error).message };
  }
}

export function validateRestaurantTaxId(taxId: unknown): ValidationError | null {
  if (taxId === null || taxId === undefined) {
    return null;
  }

  if (typeof taxId !== "string") {
    return { field: "taxId", message: "Restaurant tax ID must be a string" };
  }

  try {
    RestaurantTaxId.create(taxId);
    return null;
  } catch (e) {
    return { field: "taxId", message: (e as Error).message };
  }
}

export function validateRestaurantPhone(phone: unknown): ValidationError | null {
  if (phone === null || phone === undefined) {
    return null;
  }

  if (typeof phone !== "string") {
    return { field: "phone", message: "Restaurant phone must be a string" };
  }

  try {
    RestaurantPhone.create(phone);
    return null;
  } catch (e) {
    return { field: "phone", message: (e as Error).message };
  }
}

export function validateRestaurantStatus(status: unknown): ValidationError | null {
  if (status === null || status === undefined) {
    return { field: "status", message: "Restaurant status is required" };
  }

  if (typeof status !== "string") {
    return { field: "status", message: "Restaurant status must be a string" };
  }

  const normalized = status.trim().toLowerCase();

  if (!RESTAURANT_STATUSES.includes(normalized as RestaurantStatusValue)) {
    return {
      field: "status",
      message: `Invalid restaurant status "${status}". Allowed: ${RESTAURANT_STATUSES.join(", ")}`,
    };
  }

  return null;
}

export function validateRestaurantForCreation(data: {
  name: unknown;
  slug: unknown;
  email?: unknown;
  taxId?: unknown;
  phone?: unknown;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  const nameError = validateRestaurantName(data.name);
  if (nameError) errors.push(nameError);

  const slugError = validateRestaurantSlug(data.slug);
  if (slugError) errors.push(slugError);

  if (data.email !== undefined) {
    const emailError = validateRestaurantEmail(data.email);
    if (emailError) errors.push(emailError);
  }

  if (data.taxId !== undefined) {
    const taxIdError = validateRestaurantTaxId(data.taxId);
    if (taxIdError) errors.push(taxIdError);
  }

  if (data.phone !== undefined) {
    const phoneError = validateRestaurantPhone(data.phone);
    if (phoneError) errors.push(phoneError);
  }

  return errors;
}
