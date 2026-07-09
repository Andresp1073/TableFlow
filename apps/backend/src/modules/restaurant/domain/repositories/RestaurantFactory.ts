import type { Restaurant } from "../models/Restaurant.js";
import type { RestaurantName } from "../models/RestaurantName.js";
import type { RestaurantSlug } from "../models/RestaurantSlug.js";
import type { RestaurantTimezone } from "../models/RestaurantTimezone.js";
import type { RestaurantCurrency } from "../models/RestaurantCurrency.js";
import type { RestaurantLanguage } from "../models/RestaurantLanguage.js";

export interface RestaurantFactory {
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
  }): Restaurant;

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
  }): Restaurant;
}
