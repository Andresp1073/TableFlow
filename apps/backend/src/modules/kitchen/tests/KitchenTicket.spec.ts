import { describe, it, expect } from "vitest";
import { KitchenTicket, TicketStatus } from "../domain/models/KitchenTicket.js";
import { PreparationTask } from "../domain/models/PreparationTask.js";
import { KitchenPriority } from "../domain/models/KitchenPriority.js";

function createTestTicket(overrides?: Record<string, unknown>): KitchenTicket {
  const defaultItems = [
    PreparationTask.create({
      id: "task-1",
      ticketId: "ticket-1",
      menuItemId: "item-1",
      menuItemName: "Burger",
      quantity: 2,
      stationId: "grill-1",
      modifiers: ["no onions"],
      estimatedPrepTimeSeconds: 600,
    }),
    PreparationTask.create({
      id: "task-2",
      ticketId: "ticket-1",
      menuItemId: "item-2",
      menuItemName: "Fries",
      quantity: 2,
      stationId: "fry-1",
      modifiers: [],
      estimatedPrepTimeSeconds: 300,
    }),
  ];

  return KitchenTicket.create({
    id: "ticket-1",
    restaurantId: "rest-1",
    kitchenId: "kitchen-1",
    orderId: "order-1",
    stationId: "grill-1",
    priority: KitchenPriority.Normal,
    items: defaultItems,
    notes: [],
    ...overrides,
  } as any);
}

describe("KitchenTicket", () => {
  it("creates a ticket in New status", () => {
    const ticket = createTestTicket();
    expect(ticket.status).toBe(TicketStatus.New);
    expect(ticket.id).toBe("ticket-1");
    expect(ticket.items).toHaveLength(2);
  });

  it("transitions through full lifecycle", () => {
    const ticket = createTestTicket();
    expect(ticket.status).toBe(TicketStatus.New);

    const accepted = ticket.accept();
    expect(accepted.status).toBe(TicketStatus.Accepted);
    expect(accepted.acceptedAt).toBeInstanceOf(Date);

    const preparing = accepted.startPreparing();
    expect(preparing.status).toBe(TicketStatus.Preparing);
    expect(preparing.startedAt).toBeInstanceOf(Date);

    const completed1 = preparing.completeItem("task-1");
    expect(completed1.status).toBe(TicketStatus.Preparing);

    const completed2 = completed1.completeItem("task-2");
    expect(completed2.status).toBe(TicketStatus.Ready);
    expect(completed2.completedAt).toBeInstanceOf(Date);

    const delivered = completed2.deliver();
    expect(delivered.status).toBe(TicketStatus.Delivered);
  });

  it("rejects invalid transitions", () => {
    const ticket = createTestTicket();
    expect(() => ticket.deliver()).toThrow();
    expect(() => ticket.transitionTo(TicketStatus.Delivered)).toThrow();
  });

  it("cancels a ticket", () => {
    const ticket = createTestTicket();
    const cancelled = ticket.cancel("Customer changed order");
    expect(cancelled.status).toBe(TicketStatus.Cancelled);
    expect(cancelled.cancellationReason).toBe("Customer changed order");
    expect(cancelled.cancelledAt).toBeInstanceOf(Date);
  });

  it("adds notes", () => {
    const ticket = createTestTicket();
    const withNote = ticket.addNote("Extra well done");
    expect(withNote.notes).toContain("Extra well done");
  });

  it("reassigns station", () => {
    const ticket = createTestTicket();
    const reassigned = ticket.reassignStation("grill-2");
    expect(reassigned.stationId).toBe("grill-2");
  });

  it("updates priority", () => {
    const ticket = createTestTicket();
    const updated = ticket.updatePriority(KitchenPriority.Urgent);
    expect(updated.priority).toBe(KitchenPriority.Urgent);
  });

  it("calculates waiting time", () => {
    const ticket = createTestTicket();
    const waiting = ticket.getWaitingTimeMs();
    expect(waiting).toBeGreaterThanOrEqual(0);
  });

  it("detects delay", () => {
    const oldTicket = KitchenTicket.reconstitute({
      ...createTestTicket().value,
      createdAt: new Date(Date.now() - 60000),
    });
    expect(oldTicket.isDelayed(1000)).toBe(true);
    expect(oldTicket.isDelayed(99999999)).toBe(false);
  });
});
