import type { DemandSnapshot } from "../models/DemandSnapshot.js";

export interface DemandSnapshotRepository {
  findById(id: string): Promise<DemandSnapshot | null>;
  findByRestaurant(restaurantId: string): Promise<DemandSnapshot[]>;
  findByDateRange(restaurantId: string, fromDate: string, toDate: string): Promise<DemandSnapshot[]>;
  findByTimeSlot(restaurantId: string, timeSlot: string): Promise<DemandSnapshot[]>;
  findByDateAndSlot(restaurantId: string, date: string, timeSlot: string): Promise<DemandSnapshot | null>;
  save(snapshot: DemandSnapshot): Promise<void>;
  delete(id: string): Promise<void>;
}
