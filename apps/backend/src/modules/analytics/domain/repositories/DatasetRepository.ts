import type { AnalyticsDataset } from "../models/AnalyticsDataset.js";
import type { DatasetType } from "../models/AnalyticsDataset.js";

export interface DatasetRepository {
  save(dataset: AnalyticsDataset): Promise<void>;
  findById(id: string): Promise<AnalyticsDataset | null>;
  findByRestaurant(restaurantId: string): Promise<AnalyticsDataset[]>;
  findByType(restaurantId: string, type: DatasetType): Promise<AnalyticsDataset[]>;
  findByName(restaurantId: string, name: string): Promise<AnalyticsDataset | null>;
  delete(id: string): Promise<void>;
}
