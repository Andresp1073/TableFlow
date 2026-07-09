import type { Restaurant } from "../../domain/models/Restaurant.js";
import { RestaurantName } from "../../domain/models/RestaurantName.js";
import { RestaurantSlug } from "../../domain/models/RestaurantSlug.js";
import { RestaurantStatus } from "../../domain/models/RestaurantStatus.js";
import { RestaurantTimezone } from "../../domain/models/RestaurantTimezone.js";
import { RestaurantCurrency } from "../../domain/models/RestaurantCurrency.js";
import { RestaurantLanguage } from "../../domain/models/RestaurantLanguage.js";
import { RestaurantEmail } from "../../domain/models/RestaurantEmail.js";
import { RestaurantTaxId } from "../../domain/models/RestaurantTaxId.js";
import { RestaurantPhone } from "../../domain/models/RestaurantPhone.js";

export interface OrganizationRecord {
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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
}

export class PersistenceMapper {
  static toDomain(record: OrganizationRecord): Restaurant {
    return {
      id: record.id,
      name: RestaurantName.reconstitute(record.name),
      slug: RestaurantSlug.reconstitute(record.slug),
      legalName: record.legalName,
      taxId: record.taxId ? RestaurantTaxId.reconstitute(record.taxId) : null,
      email: record.email ? RestaurantEmail.reconstitute(record.email) : null,
      phone: record.phone ? RestaurantPhone.reconstitute(record.phone) : null,
      website: record.website,
      logoUrl: record.logoUrl,
      address: record.address,
      status: RestaurantStatus.reconstitute(record.status),
      timezone: RestaurantTimezone.reconstitute(record.timezone),
      currency: RestaurantCurrency.reconstitute(record.currency),
      language: RestaurantLanguage.reconstitute(record.language),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      deletedBy: record.deletedBy,
    };
  }

  static toPersistence(restaurant: Restaurant): Omit<OrganizationRecord, "isActive" | "createdAt" | "updatedAt"> {
    return {
      id: restaurant.id,
      name: restaurant.name.value,
      slug: restaurant.slug.value,
      legalName: restaurant.legalName,
      taxId: restaurant.taxId?.value ?? null,
      email: restaurant.email?.value ?? null,
      phone: restaurant.phone?.value ?? null,
      website: restaurant.website,
      logoUrl: restaurant.logoUrl,
      address: restaurant.address,
      status: restaurant.status.value,
      timezone: restaurant.timezone.value,
      currency: restaurant.currency.value,
      language: restaurant.language.value,
      deletedAt: restaurant.deletedAt,
      deletedBy: restaurant.deletedBy,
    };
  }
}
