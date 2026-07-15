import { describe, it, expect } from "vitest";
import { PriorityEngine } from "../domain/services/PriorityEngine.js";
import { KitchenTicket } from "../domain/models/KitchenTicket.js";
import { KitchenPriority, isHigherPriority, comparePriority } from "../domain/models/KitchenPriority.js";
import { PreparationTask } from "../domain/models/PreparationTask.js";

function createTicket(id: string, priority: KitchenPriority): KitchenTicket {
  return KitchenTicket.create({
    id,
    restaurantId: "rest-1",
    kitchenId: "kitchen-1",
    orderId: `order-${id}`,
    stationId: "grill-1",
    priority,
    items: [],
    notes: [],
  });
}

describe("KitchenPriority", () => {
  it("has correct priority order", () => {
    expect(isHigherPriority(KitchenPriority.VIP, KitchenPriority.Normal)).toBe(true);
    expect(isHigherPriority(KitchenPriority.Normal, KitchenPriority.VIP)).toBe(false);
    expect(isHigherPriority(KitchenPriority.Urgent, KitchenPriority.High)).toBe(true);
  });

  it("compares priorities", () => {
    expect(comparePriority(KitchenPriority.Normal, KitchenPriority.High)).toBeLessThan(0);
    expect(comparePriority(KitchenPriority.Urgent, KitchenPriority.Normal)).toBeGreaterThan(0);
    expect(comparePriority(KitchenPriority.Normal, KitchenPriority.Normal)).toBe(0);
  });
});

describe("PriorityEngine", () => {
  const engine = new PriorityEngine(60000);

  it("returns higher score for VIP tickets", () => {
    const normal = createTicket("t1", KitchenPriority.Normal);
    const vip = createTicket("t2", KitchenPriority.VIP);

    const normalScore = engine.calculateScore(normal);
    const vipScore = engine.calculateScore(vip);

    expect(vipScore).toBeGreaterThan(normalScore);
  });

  it("selects highest priority ticket as next", () => {
    const tickets = [
      createTicket("t1", KitchenPriority.Normal),
      createTicket("t2", KitchenPriority.High),
      createTicket("t3", KitchenPriority.Urgent),
    ];

    const next = engine.getNextTicket(tickets);
    expect(next?.id).toBe("t3");
  });

  it("sorts tickets by priority then FIFO", () => {
    const tickets = [
      createTicket("t1", KitchenPriority.Normal),
      createTicket("t2", KitchenPriority.Urgent),
      createTicket("t3", KitchenPriority.High),
    ];

    const sorted = engine.getSortedByPriority(tickets);
    expect(sorted[0].id).toBe("t2");
    expect(sorted[1].id).toBe("t3");
    expect(sorted[2].id).toBe("t1");
  });

  it("returns null when no active tickets", () => {
    const result = engine.getNextTicket([]);
    expect(result).toBeNull();
  });

  it("assesses ticket priority scores", () => {
    const ticket = createTicket("t1", KitchenPriority.High);
    const assessment = engine.assessTicket(ticket);
    expect(assessment.ticketId).toBe("t1");
    expect(assessment.basePriority).toBe(KitchenPriority.High);
    expect(assessment.score).toBeGreaterThan(0);
    expect(typeof assessment.waitingTimeMs).toBe("number");
  });

  it("assesses multiple tickets sorted by score", () => {
    const tickets = [
      createTicket("t1", KitchenPriority.Normal),
      createTicket("t2", KitchenPriority.Urgent),
    ];

    const results = engine.assessTickets(tickets);
    expect(results).toHaveLength(2);
    expect(results[0].ticketId).toBe("t2");
    expect(results[1].ticketId).toBe("t1");
  });
});
