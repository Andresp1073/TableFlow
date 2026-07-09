import type { RestaurantName } from "./RestaurantName.js";
import type { RestaurantSlug } from "./RestaurantSlug.js";
import type { RestaurantStatus } from "./RestaurantStatus.js";
import type { RestaurantTimezone } from "./RestaurantTimezone.js";
import type { RestaurantCurrency } from "./RestaurantCurrency.js";
import type { RestaurantLanguage } from "./RestaurantLanguage.js";
import type { RestaurantEmail } from "./RestaurantEmail.js";
import type { RestaurantTaxId } from "./RestaurantTaxId.js";
import type { RestaurantPhone } from "./RestaurantPhone.js";

export interface Restaurant {
  id: string;
  name: RestaurantName;
  slug: RestaurantSlug;
  legalName: string | null;
  taxId: RestaurantTaxId | null;
  email: RestaurantEmail | null;
  phone: RestaurantPhone | null;
  website: string | null;
  logoUrl: string | null;
  address: string | null;
  status: RestaurantStatus;
  timezone: RestaurantTimezone;
  currency: RestaurantCurrency;
  language: RestaurantLanguage;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
}
