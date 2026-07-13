import type { FloorLayout } from "../models/FloorLayout.js";

export interface FloorLayoutRepository {
  save(layout: FloorLayout): Promise<FloorLayout>;
  update(layout: FloorLayout): Promise<FloorLayout>;
  findById(id: string): Promise<FloorLayout | null>;
  findByRestaurantId(restaurantId: string): Promise<FloorLayout | null>;
}
