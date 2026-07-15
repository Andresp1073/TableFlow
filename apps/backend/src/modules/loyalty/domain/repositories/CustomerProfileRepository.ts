import type { CustomerProfile } from "../models/CustomerProfile.js";

export interface CustomerProfileRepository {
  findById(id: string): Promise<CustomerProfile | null>;
  findByCustomerId(customerId: string, restaurantId: string): Promise<CustomerProfile | null>;
  findByEmail(email: string, restaurantId: string): Promise<CustomerProfile | null>;
  findByRestaurant(restaurantId: string): Promise<CustomerProfile[]>;
  findByTier(tier: string, restaurantId: string): Promise<CustomerProfile[]>;
  findByTag(tag: string, restaurantId: string): Promise<CustomerProfile[]>;
  save(profile: CustomerProfile): Promise<void>;
  delete(id: string): Promise<void>;
}
