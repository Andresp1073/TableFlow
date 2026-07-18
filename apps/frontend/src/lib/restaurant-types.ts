export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  legalName: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  logoUrl: string | null;
  timezone: string;
  currency: string;
  language: string;
  status: RestaurantStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type RestaurantStatus = 'draft' | 'pending' | 'active' | 'suspended' | 'inactive' | 'archived';

export interface RestaurantCreateInput {
  name: string;
  slug: string;
  legalName?: string | null;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  timezone?: string;
  currency?: string;
  language?: string;
}

export interface RestaurantUpdateInput {
  name?: string;
  slug?: string;
  legalName?: string | null;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  timezone?: string;
  currency?: string;
  language?: string;
}

export interface RestaurantListParams {
  page?: number;
  limit?: number;
  status?: RestaurantStatus;
  search?: string;
  sortBy?: 'name' | 'slug' | 'createdAt' | 'updatedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface RestaurantListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const RESTAURANT_STATUS_OPTIONS: { value: RestaurantStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

export const RESTAURANT_SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'slug', label: 'Slug' },
  { value: 'createdAt', label: 'Created' },
  { value: 'updatedAt', label: 'Updated' },
  { value: 'status', label: 'Status' },
];
