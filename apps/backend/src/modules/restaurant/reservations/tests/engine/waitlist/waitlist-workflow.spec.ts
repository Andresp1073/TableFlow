import { describe, it, expect, vi, beforeEach } from "vitest";
import { WaitlistEngine } from "../../../engine/waitlist/WaitlistEngine.js";
import { WaitlistStatus } from "../../../engine/waitlist/WaitlistStatus.js";
import { ReservationSource } from "../../../domain/models/ReservationSource.js";
import type { WaitlistEntry } from "../../../engine/waitlist/WaitlistEntry.js";

function createEntry(overrides: Partial<WaitlistEntry> = {}): WaitlistEntry {
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
    priority: 0.5,
    notes: null,
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(),
    expiredAt: null,
    promotedAt: null,
    ...overrides,
  };
}

describe("WaitlistEngine Integration", () => {
  let engine: WaitlistEngine;
  let mockRepository: any;
  let mockAvailabilityService: any;

  beforeEach(() => {
    mockRepository = {
      save: vi.fn().mockImplementation((e: WaitlistEntry) => Promise.resolve({ ...e, id: e.id || "wl-new" })),
      update: vi.fn().mockImplementation((e: WaitlistEntry) => Promise.resolve(e)),
      findById: vi.fn(),
      findByIdAndRestaurant: vi.fn(),
      findByRestaurantId: vi.fn().mockResolvedValue([]),
      findByStatus: vi.fn().mockResolvedValue([]),
      findByFilters: vi.fn().mockResolvedValue([]),
      remove: vi.fn().mockResolvedValue(undefined),
      countByRestaurant: vi.fn().mockResolvedValue(0),
    };

    mockAvailabilityService = {
      checkAvailability: vi.fn().mockResolvedValue({ available: true, reason: null }),
    };

    engine = new WaitlistEngine({
      repository: mockRepository,
      availabilityService: mockAvailabilityService,
    });
  });

  it("adds a customer to the waitlist", async () => {
    const entry = await engine.addToWaitlist({
      restaurantId: "rest-1",
      customerId: "cust-1",
      partySize: 4,
      source: ReservationSource.create("website"),
      requestedDate: new Date("2099-07-14"),
      requestedStartTime: new Date("2099-07-14T18:00:00Z"),
      requestedEndTime: new Date("2099-07-14T20:00:00Z"),
    });

    expect(entry.restaurantId).toBe("rest-1");
    expect(entry.partySize).toBe(4);
    expect(entry.status.value).toBe("waiting");
    expect(entry.priority).toBeGreaterThan(0);
    expect(mockRepository.save).toHaveBeenCalledOnce();
  });

  it("cancels an existing waitlist entry", async () => {
    const existing = createEntry();
    mockRepository.findByIdAndRestaurant.mockResolvedValue(existing);
    mockRepository.update.mockResolvedValue({
      ...existing,
      status: WaitlistStatus.create("cancelled"),
    });

    const result = await engine.cancelWaitlist("wl-1", "rest-1");
    expect(result.status.value).toBe("cancelled");
  });

  it("promotes the next candidate", async () => {
    const entry = createEntry();
    mockRepository.findByStatus.mockResolvedValue([entry]);
    mockRepository.update.mockResolvedValue({
      ...entry,
      status: WaitlistStatus.create("promoted"),
      promotedAt: new Date(),
    });

    const result = await engine.promoteNext("rest-1");
    expect(result.promoted).toBe(true);
    expect(result.entry).toBeDefined();
  });

  it("returns active waitlist entries", async () => {
    const entries = [
      createEntry({ id: "e1" }),
      createEntry({ id: "e2", status: WaitlistStatus.create("promoted") }),
    ];
    mockRepository.findByRestaurantId.mockResolvedValue(entries);

    const active = await engine.getActiveWaitlist("rest-1");
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe("e1");
  });

  it("returns position in waitlist", async () => {
    const entries = [
      createEntry({ id: "high", partySize: 2, source: ReservationSource.create("walk_in") }),
      createEntry({ id: "mid", partySize: 4, source: ReservationSource.create("phone") }),
      createEntry({ id: "low", partySize: 8, source: ReservationSource.create("api") }),
    ];
    mockRepository.findByRestaurantId.mockResolvedValue(entries);

    const position = await engine.getPosition("mid", "rest-1");
    expect(position).toBeGreaterThan(0);
    expect(position).toBeLessThanOrEqual(3);
  });

  it("returns -1 for non-existent position", async () => {
    mockRepository.findByRestaurantId.mockResolvedValue([]);

    const position = await engine.getPosition("nonexistent", "rest-1");
    expect(position).toBe(-1);
  });

  it("removes a waitlist entry", async () => {
    const existing = createEntry();
    mockRepository.findByIdAndRestaurant.mockResolvedValue(existing);

    await engine.removeFromWaitlist("wl-1", "rest-1");
    expect(mockRepository.remove).toHaveBeenCalledWith("wl-1");
  });

  it("returns the waitlist count", async () => {
    mockRepository.countByRestaurant.mockResolvedValue(5);

    const count = await engine.getWaitlistCount("rest-1");
    expect(count).toBe(5);
  });

  it("finds next candidates", async () => {
    const entries = [
      createEntry({ id: "e1" }),
      createEntry({ id: "e2" }),
    ];
    mockRepository.findByStatus.mockResolvedValue(entries);

    const candidates = await engine.findNextCandidates("rest-1", 5);
    expect(candidates.length).toBeGreaterThan(0);
  });

  it("rejects invalid waitlist addition", async () => {
    await expect(
      engine.addToWaitlist({
        restaurantId: "rest-1",
        partySize: 0,
        source: ReservationSource.create("website"),
        requestedDate: new Date("2099-07-14"),
        requestedStartTime: new Date("2099-07-14T18:00:00Z"),
        requestedEndTime: new Date("2099-07-14T20:00:00Z"),
      }),
    ).rejects.toThrow("Cannot add to waitlist");
  });

  it("rejects duplicate removal of non-existent entry", async () => {
    mockRepository.findByIdAndRestaurant.mockResolvedValue(null);

    await expect(
      engine.removeFromWaitlist("nonexistent", "rest-1"),
    ).rejects.toThrow("not found");
  });
});
