import { describe, it, expect, vi, beforeEach } from "vitest";
import { WaitlistCandidateSelector } from "../../../engine/waitlist/WaitlistCandidateSelector.js";
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
    requestedDate: new Date("2099-07-14"),
    requestedStartTime: new Date("2099-07-14T18:00:00Z"),
    requestedEndTime: new Date("2099-07-14T20:00:00Z"),
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

describe("WaitlistCandidateSelector", () => {
  let mockAvailabilityService: any;
  let selector: WaitlistCandidateSelector;

  beforeEach(() => {
    mockAvailabilityService = {
      checkAvailability: vi.fn().mockResolvedValue({ available: true, reason: null }),
    };

    selector = new WaitlistCandidateSelector(mockAvailabilityService);
  });

  it("returns null when no entries provided", async () => {
    const result = await selector.selectBestCandidate([]);
    expect(result.selected).toBeNull();
    expect(result.reason).toBe("No candidates available");
  });

  it("selects the highest priority candidate when all are available", async () => {
    const lowPriority = createEntry({
      id: "low",
      partySize: 8,
      source: ReservationSource.create("api"),
      createdAt: new Date(Date.now() - 600000),
    });
    const highPriority = createEntry({
      id: "high",
      partySize: 2,
      source: ReservationSource.create("walk_in"),
      createdAt: new Date(Date.now() - 7200000),
    });

    const result = await selector.selectBestCandidate([lowPriority, highPriority]);
    expect(result.selected?.id).toBe("high");
  });

  it("filters out ineligible entries", async () => {
    const cancelled = createEntry({
      id: "cancelled",
      status: WaitlistStatus.create("cancelled"),
    });
    const active = createEntry({ id: "active" });

    const result = await selector.selectBestCandidate([cancelled, active]);
    expect(result.selected?.id).toBe("active");
  });

  it("checks availability for each candidate in priority order", async () => {
    mockAvailabilityService.checkAvailability
      .mockResolvedValueOnce({ available: false, reason: "no_tables" })
      .mockResolvedValueOnce({ available: true, reason: null });

    const entry1 = createEntry({ id: "first" });
    const entry2 = createEntry({ id: "second" });

    const result = await selector.selectBestCandidate([entry1, entry2]);
    expect(result.selected?.id).toBe("second");
  });

  it("returns null when no candidate has availability", async () => {
    mockAvailabilityService.checkAvailability.mockResolvedValue({
      available: false,
      reason: "restaurant_closed",
    });

    const entries = [
      createEntry({ id: "e1" }),
      createEntry({ id: "e2" }),
    ];

    const result = await selector.selectBestCandidate(entries);
    expect(result.selected).toBeNull();
    expect(result.reason).toBe("No candidates with availability");
  });

  it("finds candidates for a specific time slot by party size", async () => {
    const matching = createEntry({ id: "match", partySize: 4 });
    const tooLarge = createEntry({ id: "large", partySize: 10 });

    const result = await selector.findCandidatesForTimeSlot(
      [matching, tooLarge],
      4,
      new Date("2099-07-14T18:00:00Z"),
      new Date("2099-07-14T20:00:00Z"),
    );

    expect(result.selected?.id).toBe("match");
  });

  it("returns the best candidate and all candidates in selection result", async () => {
    const e1 = createEntry({ id: "e1" });
    const e2 = createEntry({ id: "e2" });

    const result = await selector.selectBestCandidate([e1, e2]);
    expect(result.selected).toBeDefined();
    expect(result.candidates).toHaveLength(2);
  });
});
