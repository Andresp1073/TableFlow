import type { LoyaltyProgram } from "../models/LoyaltyProgram.js";
import type { CustomerSegment } from "../models/CustomerSegment.js";
import type { LoyaltyPolicy } from "../models/LoyaltyPolicy.js";

export interface LoyaltyProgramRepository {
  findById(id: string): Promise<LoyaltyProgram | null>;
  findByRestaurant(restaurantId: string): Promise<LoyaltyProgram[]>;
  findActiveByRestaurant(restaurantId: string): Promise<LoyaltyProgram[]>;
  save(program: LoyaltyProgram): Promise<void>;
  delete(id: string): Promise<void>;

  findSegmentById(id: string): Promise<CustomerSegment | null>;
  findSegmentsByRestaurant(restaurantId: string): Promise<CustomerSegment[]>;
  saveSegment(segment: CustomerSegment): Promise<void>;
  deleteSegment(id: string): Promise<void>;

  findPolicyById(id: string): Promise<LoyaltyPolicy | null>;
  findPolicyByRestaurant(restaurantId: string): Promise<LoyaltyPolicy | null>;
  savePolicy(policy: LoyaltyPolicy): Promise<void>;
}
