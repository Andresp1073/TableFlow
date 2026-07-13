import type { Customer } from "../models/Customer.js";
import type { CustomerName } from "../models/CustomerName.js";
import type { CustomerEmail } from "../models/CustomerEmail.js";
import type { CustomerPhone } from "../models/CustomerPhone.js";
import type { CustomerStatus } from "../models/CustomerStatus.js";
import type { PreferredLanguage } from "../models/PreferredLanguage.js";

export interface CreateCustomerData {
  restaurantId: string;
  name: CustomerName;
  email?: CustomerEmail | null;
  phone?: CustomerPhone | null;
  birthDate?: Date | null;
  preferredLanguage?: PreferredLanguage;
  notes?: string | null;
  marketingConsent?: boolean;
  createdBy: string;
}

export interface ReconstituteCustomerData {
  id: string;
  restaurantId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  birthDate: Date | null;
  preferredLanguage: string;
  notes: string | null;
  marketingConsent: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

export interface CustomerFactory {
  create(data: CreateCustomerData): Customer;
  reconstitute(data: ReconstituteCustomerData): Customer;
}
