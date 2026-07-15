import { describe, it, expect } from "vitest";
import { SLATracker, DEFAULT_SLA_CONFIG } from "../domain/services/SLATracker.js";
import { KitchenTicket } from "../domain/models/KitchenTicket.js";
import { KitchenPriority } from "../domain/models/KitchenPriority.js";

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

describe("SLATracker", () => {
  const tracker = new SLATracker();

  it("has correct default SLA limits", () => {
    expect(DEFAULT_SLA_CONFIG.normalMs).toBe(600000);
    expect(DEFAULT_SLA_CONFIG.vipMs).toBe(180000);
  });

  it("returns different limits per priority", () => {
    expect(tracker.getSLALimit(KitchenPriority.Normal)).toBe(600000);
    expect(tracker.getSLALimit(KitchenPriority.VIP)).toBe(180000);
    expect(tracker.getSLALimit(KitchenPriority.Urgent)).toBe(300000);
  });

  it("checks ticket SLA status", () => {
    const ticket = createTicket("t1", KitchenPriority.Normal);
    const result = tracker.checkTicket(ticket);
    expect(result.ticketId).toBe("t1");
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(result.limitMs).toBe(600000);
    expect(result.remainingMs).toBeGreaterThan(0);
    expect(["on_track", "warning", "delayed"]).toContain(result.status);
  });

  it("returns on_track for new tickets", () => {
    const ticket = createTicket("t1", KitchenPriority.Normal);
    const result = tracker.checkTicket(ticket);
    expect(result.status).toBe("on_track");
  });

  it("finds no delayed tickets for new tickets", () => {
    const tickets = [
      createTicket("t1", KitchenPriority.Normal),
      createTicket("t2", KitchenPriority.High),
    ];
    const delayed = tracker.getDelayedTickets(tickets);
    expect(delayed).toHaveLength(0);
  });

  it("computes SLA summary", () => {
    const tickets = [
      createTicket("t1", KitchenPriority.Normal),
      createTicket("t2", KitchenPriority.High),
    ];
    const summary = tracker.getSLASummary(tickets);
    expect(summary.total).toBe(2);
    expect(summary.onTrack + summary.warning + summary.delayed).toBe(summary.total);
  });

  it("computes 100% compliance for on-track tickets", () => {
    const tickets = [
      createTicket("t1", KitchenPriority.Normal),
      createTicket("t2", KitchenPriority.High),
    ];
    const summary = tracker.getSLASummary(tickets);
    expect(summary.complianceRate).toBe(1);
  });

  it("uses custom SLA config", () => {
    const customTracker = new SLATracker({
      normalMs: 300000,
      highMs: 200000,
      urgentMs: 100000,
      vipMs: 60000,
    });
    expect(customTracker.getSLALimit(KitchenPriority.Normal)).toBe(300000);
    expect(customTracker.getSLALimit(KitchenPriority.VIP)).toBe(60000);
  });
});
