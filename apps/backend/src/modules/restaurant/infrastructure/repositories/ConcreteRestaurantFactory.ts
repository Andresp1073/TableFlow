import { randomUUID } from "node:crypto";
import type { Restaurant } from "../../domain/models/Restaurant.js";
import type { RestaurantName } from "../../domain/models/RestaurantName.js";
import type { RestaurantSlug } from "../../domain/models/RestaurantSlug.js";
import type { RestaurantStatus } from "../../domain/models/RestaurantStatus.js";
import { RestaurantStatus as RestaurantStatusValue } from "../../domain/models/RestaurantStatus.js";
import type { RestaurantTimezone } from "../../domain/models/RestaurantTimezone.js";
import type { RestaurantCurrency } from "../../domain/models/RestaurantCurrency.js";
import type { RestaurantLanguage } from "../../domain/models/RestaurantLanguage.js";
import { RestaurantEmail } from "../../domain/models/RestaurantEmail.js";
import { RestaurantTaxId } from "../../domain/models/RestaurantTaxId.js";
import { RestaurantPhone } from "../../domain/models/RestaurantPhone.js";
import type { RestaurantFactory } from "../../domain/repositories/RestaurantFactory.js";

export class ConcreteRestaurantFactory implements RestaurantFactory {
  create(data: {
    name: RestaurantName;
    slug: RestaurantSlug;
    timezone: RestaurantTimezone;
    currency: RestaurantCurrency;
    language: RestaurantLanguage;
    legalName?: string | null;
    taxId?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    logoUrl?: string | null;
    address?: string | null;
  }): Restaurant {
    const now = new Date();

    return {
      id: randomUUID(),
      name: data.name,
      slug: data.slug,
      legalName: data.legalName ?? null,
      taxId: data.taxId ? RestaurantTaxId.reconstitute(data.taxId) : null,
      email: data.email ? RestaurantEmail.reconstitute(data.email) : null,
      phone: data.phone ? RestaurantPhone.reconstitute(data.phone) : null,
      website: data.website ?? null,
      logoUrl: data.logoUrl ?? null,
      address: data.address ?? null,
      status: RestaurantStatusValue.draft(),
      timezone: data.timezone,
      currency: data.currency,
      language: data.language,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      deletedBy: null,
    };
  }

  reconstitute(data: {
    id: string;
    name: string;
    slug: string;
    legalName: string | null;
    taxId: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    logoUrl: string | null;
    address: string | null;
    status: string;
    timezone: string;
    currency: string;
    language: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Restaurant {
    return {
      id: data.id,
      name: RestaurantName.reconstitute(data.name),
      slug: RestaurantSlug.reconstitute(data.slug),
      legalName: data.legalName,
      taxId: data.taxId ? RestaurantTaxId.reconstitute(data.taxId) : null,
      email: data.email ? RestaurantEmail.reconstitute(data.email) : null,
      phone: data.phone ? RestaurantPhone.reconstitute(data.phone) : null,
      website: data.website,
      logoUrl: data.logoUrl,
      address: data.address,
      status: RestaurantStatusValue.reconstitute(data.status),
      timezone: RestaurantTimezone.reconstitute(data.timezone),
      currency: RestaurantCurrency.reconstitute(data.currency),
      language: RestaurantLanguage.reconstitute(data.language),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
      deletedBy: null,
    };
  }
}
