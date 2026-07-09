import type { ReservationPolicy } from "../models/ReservationPolicy.js";

export interface ReservationPolicyRepository {
  findByRestaurantId(restaurantId: string): Promise<ReservationPolicy | null>;
  save(policy: ReservationPolicy): Promise<ReservationPolicy>;
  update(policy: ReservationPolicy): Promise<ReservationPolicy>;
}
