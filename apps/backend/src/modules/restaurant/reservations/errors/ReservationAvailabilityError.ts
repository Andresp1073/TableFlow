import { BusinessError } from "../../../../errors/BusinessError.js";
import type { UnavailableReason } from "../../tables/domain/services/availability/AvailabilityResult.js";

export class ReservationAvailabilityError extends BusinessError {
  public readonly reason: string | null;
  public readonly metadata: Record<string, unknown> | undefined;

  constructor(reason: UnavailableReason | null, metadata?: Record<string, unknown>) {
    const message = metadata?.message
      ? String(metadata.message)
      : `Reservation not available: ${reason ?? "unknown"}`;
    super(message, "reservation.availability");
    this.name = "ReservationAvailabilityError";
    this.reason = reason;
    this.metadata = metadata;
    Object.setPrototypeOf(this, ReservationAvailabilityError.prototype);
  }
}
