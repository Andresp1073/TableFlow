import type { Reservation } from "../models/Reservation.js";

export interface ReservationListFilters {
  restaurantId: string;
  status?: string;
  date?: Date;
  customerId?: string;
}

export interface ReservationRepository {
  save(reservation: Reservation): Promise<Reservation>;
  update(reservation: Reservation): Promise<Reservation>;
  findById(id: string): Promise<Reservation | null>;
  findByIdAndRestaurant(id: string, restaurantId: string): Promise<Reservation | null>;
  findByRestaurantId(restaurantId: string): Promise<Reservation[]>;
  findByFilters(filters: ReservationListFilters): Promise<Reservation[]>;
}
