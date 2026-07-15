import type { KitchenTicket } from "../models/KitchenTicket.js";
import type { TicketStatus } from "../models/KitchenTicket.js";
import type { KitchenPriority } from "../models/KitchenPriority.js";

export interface KitchenTicketRepository {
  findById(id: string): Promise<KitchenTicket | null>;
  findByRestaurant(restaurantId: string): Promise<KitchenTicket[]>;
  findByKitchen(kitchenId: string): Promise<KitchenTicket[]>;
  findByStation(stationId: string): Promise<KitchenTicket[]>;
  findByStatus(status: TicketStatus): Promise<KitchenTicket[]>;
  findByPriority(priority: KitchenPriority): Promise<KitchenTicket[]>;
  findActiveByKitchen(kitchenId: string): Promise<KitchenTicket[]>;
  save(ticket: KitchenTicket): Promise<void>;
  delete(id: string): Promise<void>;
}
