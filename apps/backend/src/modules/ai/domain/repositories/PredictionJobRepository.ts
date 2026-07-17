import type { PredictionJob, JobStatus, JobType } from "../models/PredictionJob.js";

export interface PredictionJobRepository {
  save(job: PredictionJob): Promise<void>;
  findById(id: string): Promise<PredictionJob | null>;
  findByRestaurant(restaurantId: string): Promise<PredictionJob[]>;
  findByStatus(status: JobStatus): Promise<PredictionJob[]>;
  findByType(restaurantId: string, type: JobType): Promise<PredictionJob[]>;
  findQueued(limit?: number): Promise<PredictionJob[]>;
  delete(id: string): Promise<void>;
}
