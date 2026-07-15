import type { CustomerProfile } from "../../domain/models/CustomerProfile.js";

export type CustomerProfileDto = {
  id: string;
  restaurantId: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  tier: string;
  totalSpent: number;
  totalVisits: number;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
  tags: string[];
  isActive: boolean;
  enrolledAt: string;
};

export function toCustomerProfileDto(profile: CustomerProfile): CustomerProfileDto {
  return {
    id: profile.id,
    restaurantId: profile.restaurantId,
    customerId: profile.customerId,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone ?? null,
    tier: profile.tier,
    totalSpent: profile.totalSpent,
    totalVisits: profile.totalVisits,
    firstVisitAt: profile.firstVisitAt?.toISOString() ?? null,
    lastVisitAt: profile.lastVisitAt?.toISOString() ?? null,
    tags: [...profile.tags],
    isActive: profile.isActive,
    enrolledAt: profile.enrolledAt.toISOString(),
  };
}
