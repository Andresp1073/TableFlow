import type { KitchenTicketRepository } from "../../domain/repositories/KitchenTicketRepository.js";
import type { KitchenStationRepository } from "../../domain/repositories/KitchenStationRepository.js";
import type { KitchenTicket } from "../../domain/models/KitchenTicket.js";
import type { TicketStatus } from "../../domain/models/KitchenTicket.js";
import type { KitchenPriority } from "../../domain/models/KitchenPriority.js";
import type { KitchenStation } from "../../domain/models/KitchenStation.js";
import { StationStatus } from "../../domain/models/KitchenStation.js";
import type { StationType } from "../../domain/models/KitchenStation.js";

export class InMemoryKitchenTicketRepository implements KitchenTicketRepository {
  private readonly tickets: Map<string, KitchenTicket> = new Map();

  async findById(id: string): Promise<KitchenTicket | null> {
    return this.tickets.get(id) ?? null;
  }

  async findByRestaurant(restaurantId: string): Promise<KitchenTicket[]> {
    return Array.from(this.tickets.values()).filter((t) => t.restaurantId === restaurantId);
  }

  async findByKitchen(kitchenId: string): Promise<KitchenTicket[]> {
    return Array.from(this.tickets.values()).filter((t) => t.kitchenId === kitchenId);
  }

  async findByStation(stationId: string): Promise<KitchenTicket[]> {
    return Array.from(this.tickets.values()).filter((t) => t.stationId === stationId);
  }

  async findByStatus(status: TicketStatus): Promise<KitchenTicket[]> {
    return Array.from(this.tickets.values()).filter((t) => t.status === status);
  }

  async findByPriority(priority: KitchenPriority): Promise<KitchenTicket[]> {
    return Array.from(this.tickets.values()).filter((t) => t.priority === priority);
  }

  async findActiveByKitchen(kitchenId: string): Promise<KitchenTicket[]> {
    return Array.from(this.tickets.values()).filter(
      (t) => t.kitchenId === kitchenId
        && t.status !== "delivered"
        && t.status !== "cancelled",
    );
  }

  async save(ticket: KitchenTicket): Promise<void> {
    this.tickets.set(ticket.id, ticket);
  }

  async delete(id: string): Promise<void> {
    this.tickets.delete(id);
  }
}

export class InMemoryKitchenStationRepository implements KitchenStationRepository {
  private readonly stations: Map<string, KitchenStation> = new Map();

  async findById(id: string): Promise<KitchenStation | null> {
    return this.stations.get(id) ?? null;
  }

  async findByKitchen(kitchenId: string): Promise<KitchenStation[]> {
    return Array.from(this.stations.values()).filter((s) => s.kitchenId === kitchenId);
  }

  async findByType(type: StationType): Promise<KitchenStation[]> {
    return Array.from(this.stations.values()).filter((s) => s.type === type);
  }

  async findByStatus(status: StationStatus): Promise<KitchenStation[]> {
    return Array.from(this.stations.values()).filter((s) => s.status === status);
  }

  async findAvailableByKitchen(kitchenId: string): Promise<KitchenStation[]> {
    return Array.from(this.stations.values()).filter(
      (s) => s.kitchenId === kitchenId && s.isAvailable(),
    );
  }

  async save(station: KitchenStation): Promise<void> {
    this.stations.set(station.id, station);
  }

  async delete(id: string): Promise<void> {
    this.stations.delete(id);
  }
}
