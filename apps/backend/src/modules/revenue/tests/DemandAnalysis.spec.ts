import { describe, it, expect } from "vitest";
import { DemandAnalyzer } from "../domain/services/DemandAnalyzer.js";
import { DemandSnapshot } from "../domain/models/DemandSnapshot.js";
import { RestaurantCapacity } from "../domain/models/RestaurantCapacity.js";

const testCapacity = RestaurantCapacity.reconstitute({
  id: "cap-1", restaurantId: "rest-1",
  diningAreas: [
    { id: "area-1", name: "Main Hall", capacity: 100, tableCount: 20, averageDiningDurationMinutes: 60, isActive: true },
    { id: "area-2", name: "Patio", capacity: 40, tableCount: 8, averageDiningDurationMinutes: 90, isActive: true },
  ],
  totalCapacity: 140,
  maxCoversPerTimeSlot: { breakfast: 80, lunch: 140, dinner: 140, late_night: 60 },
  timeSlotDurations: { breakfast: 180, lunch: 240, dinner: 300, late_night: 180 },
  minPartySize: 1, maxPartySize: 20, isActive: true,
  createdAt: new Date(), updatedAt: new Date(),
});

function makeSnapshot(overrides?: Record<string, unknown>): DemandSnapshot {
  return DemandSnapshot.reconstitute({
    id: "ds-1", restaurantId: "rest-1", date: "2026-07-15",
    timeSlot: "dinner", reservationVolume: 60, walkInVolume: 20,
    turnawayCount: 10, occupancyRate: 0.8, totalCapacity: 140,
    coversServed: 80, averagePartySize: 3.5,
    averageDiningDurationMinutes: 75, revenueGenerated: 4000,
    isHoliday: false, specialEvent: null, weather: null, notes: "",
    recordedAt: new Date(),
    ...overrides,
  });
}

describe("DemandAnalyzer", () => {
  const analyzer = new DemandAnalyzer();

  it("analyzes demand from snapshots", () => {
    const snapshots = [
      makeSnapshot({ timeSlot: "dinner", occupancyRate: 0.85, reservationVolume: 70, walkInVolume: 15 }),
      makeSnapshot({ timeSlot: "dinner", occupancyRate: 0.75, reservationVolume: 60, walkInVolume: 10 }),
      makeSnapshot({ timeSlot: "lunch", occupancyRate: 0.45, reservationVolume: 30, walkInVolume: 25 }),
    ];
    const result = analyzer.analyze(snapshots, testCapacity);
    expect(result.summary.totalReservations).toBe(160);
    expect(result.summary.totalWalkIns).toBe(50);
    expect(result.peakDemandSlot.timeSlot).toBe("dinner");
    expect(result.lowDemandSlot.timeSlot).toBe("lunch");
    expect(result.opportunities.length).toBeGreaterThan(0);
  });

  it("throws on empty snapshots", () => {
    expect(() => analyzer.analyze([], testCapacity)).toThrow("No demand snapshots");
  });

  it("calculates occupancy rate", () => {
    expect(analyzer.calculateOccupancyRate(70, 20, 100)).toBe(0.9);
  });

  it("detects increasing trend", () => {
    const snapshots = Array.from({ length: 14 }, (_, i) =>
      makeSnapshot({ date: `2026-07-${i + 1}`, occupancyRate: 0.3 + i * 0.02 }),
    );
    expect(analyzer.detectTrend(snapshots)).toBe("increasing");
  });

  it("detects decreasing trend", () => {
    const snapshots = Array.from({ length: 14 }, (_, i) =>
      makeSnapshot({ date: `2026-07-${i + 1}`, occupancyRate: 0.8 - i * 0.02 }),
    );
    expect(analyzer.detectTrend(snapshots)).toBe("decreasing");
  });

  it("detects stable trend", () => {
    const snapshots = Array.from({ length: 14 }, (_, i) =>
      makeSnapshot({ date: `2026-07-${i + 1}`, occupancyRate: 0.6 }),
    );
    expect(analyzer.detectTrend(snapshots)).toBe("stable");
  });
});
