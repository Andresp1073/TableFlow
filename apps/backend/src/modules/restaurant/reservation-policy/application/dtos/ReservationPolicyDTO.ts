export interface ReservationPolicyDTO {
  id: string;
  restaurantId: string;
  enabled: boolean;
  minPartySize: number;
  maxPartySize: number;
  defaultReservationDuration: number;
  minAdvanceBookingMinutes: number;
  maxAdvanceBookingDays: number;
  cancellationDeadlineMinutes: number;
  modificationDeadlineMinutes: number;
  allowWalkIns: boolean;
  autoConfirmReservations: boolean;
  requireCustomerPhone: boolean;
  requireCustomerEmail: boolean;
  maxActiveReservationsPerCustomer: number;
  gracePeriodMinutes: number;
  createdAt: string;
  updatedAt: string;
}
