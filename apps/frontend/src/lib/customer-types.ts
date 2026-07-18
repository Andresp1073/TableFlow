'use client';

export type CustomerStatus = 'active' | 'archived';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: CustomerStatus;
  isVip: boolean;
  totalVisits: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetail {
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
  status: CustomerStatus;
  isVip: boolean;
  totalVisits: number;
  totalSpent: number;
  averageTicket: number;
  preferredRestaurantId: string | null;
  preferredTableId: string | null;
  dietaryRestrictions: string[];
  preferences: Record<string, unknown>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface CustomerDashboardData {
  totalCustomers: number;
  activeCustomers: number;
  archivedCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  vipCustomers: number;
  birthdayCount: number;
  totalVisits: number;
  averageVisitsPerCustomer: number;
  customerGrowth: number;
  recentRegistrations: CustomerRegistration[];
  birthdays: CustomerBirthday[];
}

export interface CustomerRegistration {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  status: string;
}

export interface CustomerBirthday {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  birthDate: string;
}

export interface CreateCustomerInput {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  preferredLanguage?: string;
  notes?: string | null;
  marketingConsent?: boolean;
}

export interface UpdateCustomerInput {
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

export const CUSTOMER_STATUS_OPTIONS: { value: CustomerStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

export function getCustomerStatusColor(status: CustomerStatus): 'success' | 'secondary' {
  switch (status) {
    case 'active': return 'success';
    case 'archived': return 'secondary';
  }
}
