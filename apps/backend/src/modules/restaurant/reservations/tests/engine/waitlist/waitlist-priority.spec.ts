import { describe, it, expect } from "vitest";
import { WaitlistPriorityCalculator } from "../../../engine/waitlist/WaitlistPriorityCalculator.js";
import { WaitlistStatus } from "../../../engine/waitlist/WaitlistStatus.js";
import { ReservationSource } from "../../../domain/models/ReservationSource.js";
import type { WaitlistEntry } from "../../../engine/waitlist/WaitlistEntry.js";

function createEntry(overrides: Partial<WaitlistEntry> = {}): WaitlistEntry {
  const now = new Date();
  return {
    id: "wl-1",
    restaurantId: "rest-1",
    reservationId: null,
    customerId: "cust-1",
    partySize: 4,
    source: ReservationSource.create("website"),
    requestedDate: new Date("2026-07-14"),
    requestedStartTime: new Date("2026-07-14T18:00:00Z"),
    requestedEndTime: new Date("2026-07-14T20:00:00Z"),
    status: WaitlistStatus.create("waiting"),
    priority: 0,
    notes: null,
    createdAt: new Date(now.getTime() - 3600000),
    updatedAt: now,
    expiredAt: null,
    promotedAt: null,
    ...overrides,
  };
}

describe("WaitlistPriorityCalculator", () => {
  const calculator = new WaitlistPriorityCalculator();

  it("calculates score with default factors", () => {
    const entry = createEntry();
    const result = calculator.calculate(entry);

    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.breakdown).toHaveProperty("waitingTime");
    expect(result.breakdown).toHaveProperty("partySize");
    expect(result.breakdown).toHaveProperty("source");
  });

  it("gives higher priority to entries that have waited longer", () => {
    const oldEntry = createEntry({
      id: "old",
      createdAt: new Date(Date.now() - 7200000),
    });
    const newEntry = createEntry({
      id: "new",
      createdAt: new Date(Date.now() - 600000),
    });

    const comparison = calculator.compare(oldEntry, newEntry);
    expect(comparison).toBeLessThan(0);
  });

  it("gives higher priority to smaller parties with default weighting", () => {
    const smallParty = createEntry({ id: "small", partySize: 2 });
    const largeParty = createEntry({ id: "large", partySize: 8 });

    const comparison = calculator.compare(smallParty, largeParty);
    expect(comparison).toBeLessThan(0);
  });

  it("gives higher priority to walk-in sources", () => {
    const walkIn = createEntry({
      id: "walkin",
      source: ReservationSource.create("walk_in"),
    });
    const website = createEntry({
      id: "web",
      source: ReservationSource.create("website"),
    });

    const comparison = calculator.compare(walkIn, website);
    expect(comparison).toBeLessThan(0);
  });

  it("sorts entries by priority descending", () => {
    const entries = [
      createEntry({ id: "low", partySize: 8, source: ReservationSource.create("api") }),
      createEntry({ id: "high", partySize: 2, source: ReservationSource.create("walk_in") }),
      createEntry({ id: "mid", partySize: 4, source: ReservationSource.create("phone") }),
    ];

    const sorted = calculator.sortByPriority(entries);
    expect(sorted[0].id).toBe("high");
    expect(sorted[2].id).toBe("low");
  });

  it("supports custom factor weights", () => {
    const custom = new WaitlistPriorityCalculator({
      waitingTimeWeight: 1.0,
      partySizeWeight: 0,
      sourceWeight: 0,
    });

    const oldEntry = createEntry({
      id: "old",
      createdAt: new Date(Date.now() - 7200000),
    });
    const newEntry = createEntry({
      id: "new",
      createdAt: new Date(Date.now() - 600000),
    });

    const comparison = custom.compare(oldEntry, newEntry);
    expect(comparison).toBeLessThan(0);
  });

  it("creates new calculator with updated factors via withFactors", () => {
    const custom = calculator.withFactors({ partySizeWeight: 0.5 });
    const entry = createEntry();
    const result = custom.calculate(entry);

    expect(result.score).toBeGreaterThan(0);
  });

  it("returns same score for identical entries", () => {
    const a = createEntry({ id: "a" });
    const b = createEntry({ id: "b" });

    const scoreA = calculator.calculate(a);
    const scoreB = calculator.calculate(b);

    expect(scoreA.score).toBe(scoreB.score);
  });

  it("calculates waiting time score based on elapsed minutes", () => {
    const brandNew = createEntry({
      createdAt: new Date(),
    });
    const oneHourOld = createEntry({
      createdAt: new Date(Date.now() - 60000),
    });

    const scoreNew = calculator.calculate(brandNew);
    const scoreOld = calculator.calculate(oneHourOld);

    expect(scoreOld.score).toBeGreaterThanOrEqual(scoreNew.score);
  });
});
