export type UnavailableReason =
  | "restaurant_closed"
  | "holiday"
  | "special_closure"
  | "maintenance_closure"
  | "emergency_closure"
  | "outside_business_hours"
  | "table_inactive"
  | "table_archived"
  | "table_deleted"
  | "table_non_reservable"
  | "table_occupied"
  | "table_reserved"
  | "table_cleaning"
  | "table_blocked"
  | "table_out_of_service"
  | "table_maintenance"
  | "dining_area_inactive"
  | "dining_area_archived"
  | "dining_area_non_reservable"
  | "table_type_inactive"
  | "party_size_exceeds_maximum"
  | "party_size_below_minimum"
  | "advance_booking_window"
  | "reservation_policy_disabled"
  | "future_reservation_conflict"
  | "unknown";

export interface AvailabilityResult {
  available: boolean;
  reason: UnavailableReason | null;
  metadata?: Record<string, unknown>;
}

export function available(): AvailabilityResult {
  return { available: true, reason: null };
}

export function unavailable(reason: UnavailableReason, metadata?: Record<string, unknown>): AvailabilityResult {
  return { available: false, reason, metadata };
}
