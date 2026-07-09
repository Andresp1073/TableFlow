import type { RestaurantAsset } from "../models/RestaurantAsset.js";

export interface AssetRepository {
  findById(id: string): Promise<RestaurantAsset | null>;
  findByRestaurantId(restaurantId: string): Promise<RestaurantAsset[]>;
  findByRestaurantIdAndType(restaurantId: string, type: string): Promise<RestaurantAsset[]>;
  findPrimaryByRestaurantIdAndType(restaurantId: string, type: string): Promise<RestaurantAsset | null>;
  save(asset: RestaurantAsset): Promise<RestaurantAsset>;
  update(asset: RestaurantAsset): Promise<RestaurantAsset>;
  delete(id: string): Promise<void>;
  countByRestaurantIdAndType(restaurantId: string, type: string): Promise<number>;
}
