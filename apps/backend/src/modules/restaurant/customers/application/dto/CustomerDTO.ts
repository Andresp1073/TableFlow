export interface CustomerDTO {
  id: string;
  restaurantId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  preferredLanguage: string;
  notes: string | null;
  marketingConsent: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}
