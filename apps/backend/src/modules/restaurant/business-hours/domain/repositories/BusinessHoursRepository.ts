import type { BusinessHours } from "../models/BusinessHours.js";

export interface BusinessHoursRepository {
  findByRestaurantId(restaurantId: string): Promise<BusinessHours | null>;
  save(businessHours: BusinessHours): Promise<BusinessHours>;
  update(businessHours: BusinessHours): Promise<BusinessHours>;
}
