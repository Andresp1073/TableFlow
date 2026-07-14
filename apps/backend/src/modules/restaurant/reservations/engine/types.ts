import type { AuthorizationContext } from "../../../authorization/domain/models/AuthorizationContext.js";
import type { ApplicationMetadata } from "../application/services/ReservationApplicationService.js";

export interface EngineContext {
  auth: AuthorizationContext;
  metadata?: ApplicationMetadata;
}

export interface ConflictResolutionResult {
  hasConflict: boolean;
  conflictingReservations: string[];
  reason: string | null;
}

export interface PolicyEvaluationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface EngineOperationResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}
