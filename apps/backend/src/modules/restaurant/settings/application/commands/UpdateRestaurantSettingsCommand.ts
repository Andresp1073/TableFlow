export interface UpdateRestaurantSettingsCommand {
  restaurantId: string;
  timezone?: string;
  currency?: string;
  language?: string;
  dateFormat?: string;
  timeFormat?: string;
  weekStartsOn?: number;
  taxPercentage?: number;
  serviceChargePercentage?: number;
  defaultReservationDuration?: number;
  reservationBufferMinutes?: number;
  allowWalkIns?: boolean;
  autoConfirmReservations?: boolean;
  maxReservationsPerCustomer?: number;
  reservationCancellationHours?: number;
}
