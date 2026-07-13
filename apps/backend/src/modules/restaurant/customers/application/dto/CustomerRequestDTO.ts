export interface CreateCustomerRequest {
  restaurantId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  preferredLanguage?: string;
  notes?: string | null;
  marketingConsent?: boolean;
}

export interface UpdateCustomerRequest {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  preferredLanguage?: string;
  status?: string;
  notes?: string | null;
  marketingConsent?: boolean;
}
