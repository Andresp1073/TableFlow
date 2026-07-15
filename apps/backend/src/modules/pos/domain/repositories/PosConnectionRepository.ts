import type { PosConnection } from "../models/PosConnection.js";
import type { PosConnectionStatus } from "../models/PosConnection.js";

export interface PosConnectionRepository {
  findById(id: string): Promise<PosConnection | null>;
  findByRestaurant(restaurantId: string): Promise<PosConnection[]>;
  findByProvider(providerId: string): Promise<PosConnection[]>;
  findByStatus(status: PosConnectionStatus): Promise<PosConnection[]>;
  findByRestaurantAndProvider(
    restaurantId: string,
    providerId: string,
  ): Promise<PosConnection | null>;
  save(connection: PosConnection): Promise<void>;
  delete(id: string): Promise<void>;
}
