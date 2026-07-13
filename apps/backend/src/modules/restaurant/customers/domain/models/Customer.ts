import type { CustomerName } from "./CustomerName.js";
import type { CustomerEmail } from "./CustomerEmail.js";
import type { CustomerPhone } from "./CustomerPhone.js";
import type { CustomerStatus } from "./CustomerStatus.js";
import type { PreferredLanguage } from "./PreferredLanguage.js";

export interface Customer {
  id: string;
  restaurantId: string;
  name: CustomerName;
  email: CustomerEmail | null;
  phone: CustomerPhone | null;
  birthDate: Date | null;
  preferredLanguage: PreferredLanguage;
  notes: string | null;
  marketingConsent: boolean;
  status: CustomerStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}
