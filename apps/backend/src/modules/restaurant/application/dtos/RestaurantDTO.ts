export interface RestaurantDTO {
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
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
