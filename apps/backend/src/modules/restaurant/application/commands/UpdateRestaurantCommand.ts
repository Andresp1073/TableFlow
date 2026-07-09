export interface UpdateRestaurantCommand {
  id: string;
  name?: string;
  slug?: string;
  legalName?: string | null;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  timezone?: string;
  currency?: string;
  language?: string;
}
