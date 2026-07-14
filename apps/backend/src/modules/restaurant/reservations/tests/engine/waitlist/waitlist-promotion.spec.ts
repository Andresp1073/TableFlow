import { describe, it, expect, vi, beforeEach } from "vitest";
import { WaitlistPromotionCoordinator } from "../../../engine/waitlist/WaitlistPromotionCoordinator.js";
import { WaitlistCandidateSelector } from "../../../engine/waitlist/WaitlistCandidateSelector.js";
import { WaitlistEligibilityPolicy } from "../../../engine/waitlist/WaitlistEligibilityPolicy.js";
import { WaitlistPriorityCalculator } from "../../../engine/waitlist/WaitlistPriorityCalculator.js";
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
    createdAt: new Date(),
    updatedAt: new Date(),
    expiredAt: null,
    promotedAt: null,
    ...overrides,
  };
}

describe("WaitlistPromotionCoordinator", () => {
  let mockRepository: any;
  let mockAvailabilityService: any;
  let coordinator: WaitlistPromotionCoordinator;

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
      update: vi.fn().mockImplementation((e: WaitlistEntry) => Promise.resolve(e)),
      findById: vi.fn(),
      findByIdAndRestaurant: vi.fn(),
      findByRestaurantId: vi.fn(),
      findByStatus: vi.fn().mockResolvedValue([]),
      findByFilters: vi.fn(),
      remove: vi.fn(),
      countByRestaurant: vi.fn(),
    };

    mockAvailabilityService = {
      checkAvailability: vi.fn().mockResolvedValue({ available: true, reason: null }),
    };

    const selector = new WaitlistCandidateSelector(
      mockAvailabilityService,
      new WaitlistPriorityCalculator(),
      new WaitlistEligibilityPolicy(),
    );

    coordinator = new WaitlistPromotionCoordinator(
      mockRepository,
      selector,
      new WaitlistEligibilityPolicy(),
      new WaitlistPriorityCalculator(),
    );
  });

  it("returns no promotion when waitlist is empty", async () => {
    mockRepository.findByStatus.mockResolvedValue([]);

    const result = await coordinator.promoteNext("rest-1");
    expect(result.promoted).toBe(false);
    expect(result.reason).toBe("No waitlist entries");
  });

  it("promotes the best candidate when availability passes", async () => {
    const entry = createEntry();
    mockRepository.findByStatus.mockResolvedValue([entry]);
    mockRepository.update.mockResolvedValue({
      ...entry,
      status: WaitlistStatus.create("promoted"),
      promotedAt: new Date(),
    });

    const result = await coordinator.promoteNext("rest-1");
    expect(result.promoted).toBe(true);
    expect(result.entry).toBeDefined();
    expect(mockRepository.update).toHaveBeenCalled();
  });

  it("returns no promotion when no eligible entries exist", async () => {
    const cancelledEntry = createEntry({
      status: WaitlistStatus.create("cancelled"),
    });
    mockRepository.findByStatus.mockResolvedValue([cancelledEntry]);

    const result = await coordinator.promoteNext("rest-1");
    expect(result.promoted).toBe(false);
    expect(result.reason).toBe("No eligible entries");
  });

  it("returns no promotion when availability fails for all candidates", async () => {
    const entry = createEntry();
    mockRepository.findByStatus.mockResolvedValue([entry]);
    mockAvailabilityService.checkAvailability.mockResolvedValue({
      available: false,
      reason: "restaurant_closed",
    });

    const result = await coordinator.promoteNext("rest-1");
    expect(result.promoted).toBe(false);
    expect(result.reason).toBe("No candidates with availability");
  });

  it("marks entry as eligible before promoting", async () => {
    const entry = createEntry();
    mockRepository.findByStatus.mockResolvedValue([entry]);
    const updatedEntries: WaitlistEntry[] = [];

    mockRepository.update.mockImplementation((e: WaitlistEntry) => {
      updatedEntries.push(e);
      return Promise.resolve(e);
    });

    await coordinator.promoteNext("rest-1");
    expect(updatedEntries.length).toBeGreaterThan(0);
  });

  it("finds next candidates sorted by priority", async () => {
    const low = createEntry({
      id: "low",
      partySize: 8,
      source: ReservationSource.create("api"),
    });
    const high = createEntry({
      id: "high",
      partySize: 2,
      source: ReservationSource.create("walk_in"),
    });

    mockRepository.findByStatus.mockResolvedValue([low, high]);

    const candidates = await coordinator.findNextCandidates("rest-1", 5);
    expect(candidates[0].id).toBe("high");
    expect(candidates[1].id).toBe("low");
  });

  it("prepares promotion for an eligible entry", async () => {
    const entry = createEntry();
    mockRepository.update.mockResolvedValue({
      ...entry,
      status: WaitlistStatus.create("eligible"),
    });

    const result = await coordinator.preparePromotion(entry);
    expect(result.promoted).toBe(false);
    expect(result.reason).toBe("Ready for promotion");
  });

  it("refuses to prepare promotion for ineligible entry", async () => {
    const entry = createEntry({ status: WaitlistStatus.create("promoted") });

    const result = await coordinator.preparePromotion(entry);
    expect(result.promoted).toBe(false);
    expect(result.reason).toContain("terminal");
  });
});
