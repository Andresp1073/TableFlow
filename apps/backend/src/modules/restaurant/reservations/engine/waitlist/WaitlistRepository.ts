import type { WaitlistEntry } from "./WaitlistEntry.js";
import type { WaitlistStatusValue } from "./WaitlistStatus.js";

export interface WaitlistListFilters {
  restaurantId: string;
  status?: string;
  date?: Date;
  customerId?: string;
}

export interface WaitlistRepository {
  save(entry: WaitlistEntry): Promise<WaitlistEntry>;
  update(entry: WaitlistEntry): Promise<WaitlistEntry>;
  findById(id: string): Promise<WaitlistEntry | null>;
  findByIdAndRestaurant(id: string, restaurantId: string): Promise<WaitlistEntry | null>;
  findByRestaurantId(restaurantId: string): Promise<WaitlistEntry[]>;
  findByStatus(restaurantId: string, status: WaitlistStatusValue): Promise<WaitlistEntry[]>;
  findByFilters(filters: WaitlistListFilters): Promise<WaitlistEntry[]>;
  remove(id: string): Promise<void>;
  countByRestaurant(restaurantId: string): Promise<number>;
}
