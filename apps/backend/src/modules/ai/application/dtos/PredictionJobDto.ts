import type { PredictionJob, JobStatus, JobType } from "../../domain/models/PredictionJob.js";

export interface PredictionJobDto {
  id: string;
  restaurantId: string;
  type: JobType;
  status: JobStatus;
  priority: number;
  progress: number;
  retryCount: number;
  maxRetries: number;
  error: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdBy: string;
  createdAt: string;
}

export function toPredictionJobDto(job: PredictionJob): PredictionJobDto {
  return {
    id: job.id,
    restaurantId: job.restaurantId,
    type: job.type,
    status: job.status,
    priority: job.priority,
    progress: job.progress,
    retryCount: job.retryCount,
    maxRetries: job.maxRetries,
    error: job.error ?? null,
    scheduledAt: job.scheduledAt?.toISOString() ?? null,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdBy: job.createdBy,
    createdAt: job.createdAt.toISOString(),
  };
}
