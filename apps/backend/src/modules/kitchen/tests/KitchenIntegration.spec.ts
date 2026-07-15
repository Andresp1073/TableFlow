import { describe, it, expect } from "vitest";
import { KitchenManager } from "../application/services/KitchenManager.js";
import { InMemoryKitchenTicketRepository, InMemoryKitchenStationRepository } from "../infrastructure/repositories/InMemoryKitchenRepositories.js";
import { KitchenStation, StationType, StationStatus } from "../domain/models/KitchenStation.js";
import { KitchenPriority } from "../domain/models/KitchenPriority.js";
import { TicketStatus } from "../domain/models/KitchenTicket.js";

describe("Kitchen Integration", () => {
  it("processes a complete ticket lifecycle", async () => {
    const ticketRepo = new InMemoryKitchenTicketRepository();
    const stationRepo = new InMemoryKitchenStationRepository();

    const manager = new KitchenManager(ticketRepo, stationRepo);

    const station = KitchenStation.create({
      id: "grill-1",
      kitchenId: "kitchen-1",
      name: "Grill Station",
      type: StationType.Grill,
      status: StationStatus.Active,
      displayOrder: 1,
      maxConcurrentTickets: 10,
      currentTickets: 0,
      assignedStaff: [],
    });
    await stationRepo.save(station);

    const ticket = await manager.createTicket({
      id: "ticket-int-1",
      restaurantId: "rest-1",
      kitchenId: "kitchen-1",
      orderId: "order-1",
      stationId: "grill-1",
      tableId: "T5",
      customerName: "John",
      customerCount: 2,
      priority: KitchenPriority.Normal,
      items: [
        {
          id: "task-1",
          menuItemId: "item-1",
          menuItemName: "Burger",
          quantity: 2,
          stationId: "grill-1",
          modifiers: ["no onions"],
          estimatedPrepTimeSeconds: 600,
        },
        {
          id: "task-2",
          menuItemId: "item-2",
          menuItemName: "Fries",
          quantity: 1,
          stationId: "grill-1",
          modifiers: [],
          estimatedPrepTimeSeconds: 300,
        },
      ],
      notes: ["Extra well done"],
    });

    expect(ticket.status).toBe(TicketStatus.New);
    expect(ticket.items).toHaveLength(2);

    const stationAfterCreate = await stationRepo.findById("grill-1");
    expect(stationAfterCreate?.currentTickets).toBe(1);

    const accepted = await manager.acceptTicket(ticket.id);
    expect(accepted.status).toBe(TicketStatus.Accepted);

    const started = await manager.startPreparing(ticket.id);
    expect(started.status).toBe(TicketStatus.Preparing);

    const item1Done = await manager.completeItem(ticket.id, "task-1");
    expect(item1Done.status).toBe(TicketStatus.Preparing);

    const item2Done = await manager.completeItem(ticket.id, "task-2");
    expect(item2Done.status).toBe(TicketStatus.Ready);

    const stationAfterComplete = await stationRepo.findById("grill-1");
    expect(stationAfterComplete?.currentTickets).toBe(0);

    const delivered = await manager.deliverTicket(ticket.id);
    expect(delivered.status).toBe(TicketStatus.Delivered);
  });

  it("handles ticket cancellation", async () => {
    const ticketRepo = new InMemoryKitchenTicketRepository();
    const stationRepo = new InMemoryKitchenStationRepository();

    const manager = new KitchenManager(ticketRepo, stationRepo);

    const station = KitchenStation.create({
      id: "bar-1",
      kitchenId: "kitchen-1",
      name: "Bar Station",
      type: StationType.Bar,
      status: StationStatus.Active,
      displayOrder: 1,
      maxConcurrentTickets: 5,
      currentTickets: 0,
      assignedStaff: [],
    });
    await stationRepo.save(station);

    const ticket = await manager.createTicket({
      id: "ticket-cancel-1",
      restaurantId: "rest-1",
      kitchenId: "kitchen-1",
      orderId: "order-2",
      stationId: "bar-1",
      priority: KitchenPriority.High,
      items: [
        {
          id: "task-c1",
          menuItemId: "item-3",
          menuItemName: "Cocktail",
          quantity: 2,
          stationId: "bar-1",
          modifiers: [],
          estimatedPrepTimeSeconds: 120,
        },
      ],
    });

    expect(ticket.status).toBe(TicketStatus.New);

    const cancelled = await manager.cancelTicket(ticket.id, "Order cancelled by customer");
    expect(cancelled.status).toBe(TicketStatus.Cancelled);
    expect(cancelled.cancellationReason).toBe("Order cancelled by customer");

    const stationAfterCancel = await stationRepo.findById("bar-1");
    expect(stationAfterCancel?.currentTickets).toBe(0);
  });

  it("gets next ticket by priority", async () => {
    const ticketRepo = new InMemoryKitchenTicketRepository();
    const stationRepo = new InMemoryKitchenStationRepository();

    const manager = new KitchenManager(ticketRepo, stationRepo);

    const station = KitchenStation.create({
      id: "grill-1",
      kitchenId: "kitchen-1",
      name: "Grill",
      type: StationType.Grill,
      status: StationStatus.Active,
      displayOrder: 1,
      maxConcurrentTickets: 10,
      currentTickets: 0,
      assignedStaff: [],
    });
    await stationRepo.save(station);

    const t1 = await manager.createTicket({
      id: "ticket-p1",
      restaurantId: "rest-1",
      kitchenId: "kitchen-1",
      orderId: "o1",
      stationId: "grill-1",
      priority: KitchenPriority.Normal,
      items: [{ id: "t1-i1", menuItemId: "i1", menuItemName: "Item", quantity: 1, stationId: "grill-1", modifiers: [] }],
    });

    const t2 = await manager.createTicket({
      id: "ticket-p2",
      restaurantId: "rest-1",
      kitchenId: "kitchen-1",
      orderId: "o2",
      stationId: "grill-1",
      priority: KitchenPriority.Urgent,
      items: [{ id: "t2-i1", menuItemId: "i1", menuItemName: "Item", quantity: 1, stationId: "grill-1", modifiers: [] }],
    });

    const t3 = await manager.createTicket({
      id: "ticket-p3",
      restaurantId: "rest-1",
      kitchenId: "kitchen-1",
      orderId: "o3",
      stationId: "grill-1",
      priority: KitchenPriority.VIP,
      items: [{ id: "t3-i1", menuItemId: "i1", menuItemName: "Item", quantity: 1, stationId: "grill-1", modifiers: [] }],
    });

    const next = await manager.getNextTicket("kitchen-1");
    expect(next?.id).toBe("ticket-p3");

    await manager.acceptTicket("ticket-p3");
    const preparing = await manager.startPreparing("ticket-p3");
    await manager.completeItem("ticket-p3", preparing.items[0].id);
    await manager.deliverTicket("ticket-p3");

    const next2 = await manager.getNextTicket("kitchen-1");
    expect(next2?.id).toBe("ticket-p2");
  });

  it("rejects ticket creation at full station", async () => {
    const ticketRepo = new InMemoryKitchenTicketRepository();
    const stationRepo = new InMemoryKitchenStationRepository();

    const manager = new KitchenManager(ticketRepo, stationRepo);

    const station = KitchenStation.create({
      id: "full-station",
      kitchenId: "kitchen-1",
      name: "Full Station",
      type: StationType.Grill,
      status: StationStatus.Active,
      displayOrder: 1,
      maxConcurrentTickets: 1,
      currentTickets: 1,
      assignedStaff: [],
    });
    await stationRepo.save(station);

    await expect(
      manager.createTicket({
        id: "ticket-full",
        restaurantId: "rest-1",
        kitchenId: "kitchen-1",
        orderId: "order-full",
        stationId: "full-station",
        priority: KitchenPriority.Normal,
        items: [{ id: "task-full", menuItemId: "i1", menuItemName: "Item", quantity: 1, stationId: "full-station", modifiers: [] }],
      }),
    ).rejects.toThrow("Station is at capacity");
  });
});
