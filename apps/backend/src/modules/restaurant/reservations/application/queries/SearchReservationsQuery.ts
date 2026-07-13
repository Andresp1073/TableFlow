export interface SearchReservationsQuery {
  restaurantId: string;
  query?: string;
  status?: string;
  date?: string;
  customerId?: string;
}
