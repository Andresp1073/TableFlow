import type { KitchenTicketRepository } from "../../domain/repositories/KitchenTicketRepository.js";
import type { KitchenStationRepository } from "../../domain/repositories/KitchenStationRepository.js";
import { KitchenTicket } from "../../domain/models/KitchenTicket.js";
import { TicketStatus } from "../../domain/models/KitchenTicket.js";
import type { KitchenStation } from "../../domain/models/KitchenStation.js";
import { PreparationTask } from "../../domain/models/PreparationTask.js";
import { PriorityEngine } from "../../domain/services/PriorityEngine.js";
import { StationAssignmentService } from "../../domain/services/StationAssignmentService.js";
import { SLATracker } from "../../domain/services/SLATracker.js";
import type { KitchenStation as KitchenStationType } from "../../domain/models/KitchenStation.js";
import type { KitchenPriority } from "../../domain/models/KitchenPriority.js";

export class KitchenManager {
  private readonly priorityEngine: PriorityEngine;
  private readonly stationAssignmentService: StationAssignmentService;
  private readonly slaTracker: SLATracker;

  constructor(
    private readonly ticketRepository: KitchenTicketRepository,
    private readonly stationRepository: KitchenStationRepository,
  ) {
    this.priorityEngine = new PriorityEngine();
    this.stationAssignmentService = new StationAssignmentService();
    this.slaTracker = new SLATracker();
  }

  async createTicket(config: {
    id: string;
    restaurantId: string;
    kitchenId: string;
    orderId: string;
    stationId: string;
    tableId?: string;
    customerName?: string;
    customerCount?: number;
    priority: KitchenPriority;
    items: Array<{
      id: string;
      menuItemId: string;
      menuItemName: string;
      quantity: number;
      stationId: string;
      modifiers?: string[];
      notes?: string;
      estimatedPrepTimeSeconds?: number;
    }>;
    notes?: string[];
  }): Promise<KitchenTicket> {
    const station = await this.stationRepository.findById(config.stationId);
    if (!station) {
      throw new Error(`Station not found: ${config.stationId}`);
    }

    if (!station.canAcceptMoreTickets()) {
      throw new Error(`Station is at capacity: ${config.stationId}`);
    }

    const tasks = config.items.map((item) =>
      PreparationTask.create({
        id: item.id,
        ticketId: config.id,
        menuItemId: item.menuItemId,
        menuItemName: item.menuItemName,
        quantity: item.quantity,
        stationId: item.stationId,
        modifiers: item.modifiers ?? [],
        notes: item.notes,
        estimatedPrepTimeSeconds: item.estimatedPrepTimeSeconds ?? 300,
      }),
    );

    const ticket = KitchenTicket.create({
      ...config,
      items: tasks,
      notes: config.notes ?? [],
    });

    await this.ticketRepository.save(ticket);

    const updatedStation = station.incrementTickets();
    await this.stationRepository.save(updatedStation);

    return ticket;
  }

  async acceptTicket(ticketId: string): Promise<KitchenTicket> {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    const accepted = ticket.accept();
    await this.ticketRepository.save(accepted);
    return accepted;
  }

  async startPreparing(ticketId: string): Promise<KitchenTicket> {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    const started = ticket.startPreparing();
    await this.ticketRepository.save(started);

    return started;
  }

  async completeItem(ticketId: string, taskId: string): Promise<KitchenTicket> {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    const updated = ticket.completeItem(taskId);
    await this.ticketRepository.save(updated);

    if (updated.status === TicketStatus.Ready && ticket.status !== TicketStatus.Ready) {
      const station = await this.stationRepository.findById(ticket.stationId);
      if (station) {
        const released = station.decrementTickets();
        await this.stationRepository.save(released);
      }
    }

    return updated;
  }

  async deliverTicket(ticketId: string): Promise<KitchenTicket> {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    const delivered = ticket.deliver();
    await this.ticketRepository.save(delivered);
    return delivered;
  }

  async cancelTicket(ticketId: string, reason: string): Promise<KitchenTicket> {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    const cancelled = ticket.cancel(reason);
    await this.ticketRepository.save(cancelled);

    const station = await this.stationRepository.findById(ticket.stationId);
    if (station) {
      const released = station.decrementTickets();
      await this.stationRepository.save(released);
    }

    return cancelled;
  }

  async getNextTicket(kitchenId: string): Promise<KitchenTicket | null> {
    const tickets = await this.ticketRepository.findActiveByKitchen(kitchenId);
    return this.priorityEngine.getNextTicket(tickets);
  }

  async getTicketsByStation(stationId: string): Promise<KitchenTicket[]> {
    return this.ticketRepository.findByStation(stationId);
  }

  async getStationLoad(kitchenId: string): Promise<
    Array<{ station: KitchenStationType; load: number }>
  > {
    const stations = await this.stationRepository.findByKitchen(kitchenId);
    return stations.map((station) => ({
      station,
      load: this.stationAssignmentService.getStationLoad(station),
    }));
  }

  async checkSLABreach(ticketId: string): Promise<boolean> {
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }
    return this.slaTracker.checkTicket(ticket).isDelayed;
  }

  getPriorityEngine(): PriorityEngine {
    return this.priorityEngine;
  }

  getSLATracker(): SLATracker {
    return this.slaTracker;
  }
}
