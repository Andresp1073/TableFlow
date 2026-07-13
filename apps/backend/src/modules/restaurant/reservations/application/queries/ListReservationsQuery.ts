export interface ListReservationsQuery {
  restaurantId: string;
  status?: string;
  date?: string;
  customerId?: string;
}
