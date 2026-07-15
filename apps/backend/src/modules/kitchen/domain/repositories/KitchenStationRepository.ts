import type { KitchenStation } from "../models/KitchenStation.js";
import type { StationStatus, StationType } from "../models/KitchenStation.js";

export interface KitchenStationRepository {
  findById(id: string): Promise<KitchenStation | null>;
  findByKitchen(kitchenId: string): Promise<KitchenStation[]>;
  findByType(type: StationType): Promise<KitchenStation[]>;
  findByStatus(status: StationStatus): Promise<KitchenStation[]>;
  findAvailableByKitchen(kitchenId: string): Promise<KitchenStation[]>;
  save(station: KitchenStation): Promise<void>;
  delete(id: string): Promise<void>;
}
