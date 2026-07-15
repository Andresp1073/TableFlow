import { describe, it, expect } from "vitest";
import { OptimizationEngine } from "../domain/services/OptimizationEngine.js";
import { RecommendationType, RecommendationPriority } from "../domain/models/OptimizationRecommendation.js";
import { DemandSnapshot } from "../domain/models/DemandSnapshot.js";
import { RestaurantCapacity } from "../domain/models/RestaurantCapacity.js";

const testCapacity = RestaurantCapacity.reconstitute({
  id: "cap-1", restaurantId: "rest-1",
  diningAreas: [{ id: "a1", name: "Main", capacity: 100, tableCount: 20, averageDiningDurationMinutes: 60, isActive: true }],
  totalCapacity: 100,
  maxCoversPerTimeSlot: { breakfast: 50, lunch: 100, dinner: 100, late_night: 40 },
  timeSlotDurations: { breakfast: 180, lunch: 240, dinner: 300, late_night: 180 },
  minPartySize: 1, maxPartySize: 20, isActive: true,
  createdAt: new Date(), updatedAt: new Date(),
});

function makeSnapshot(overrides?: Record<string, unknown>): DemandSnapshot {
  return DemandSnapshot.reconstitute({
    id: "ds-1", restaurantId: "rest-1", date: "2026-07-15",
    timeSlot: "dinner", reservationVolume: 80, walkInVolume: 20,
    turnawayCount: 15, occupancyRate: 0.9, totalCapacity: 100,
    coversServed: 95, averagePartySize: 3.5,
    averageDiningDurationMinutes: 90, revenueGenerated: 5000,
    isHoliday: false, specialEvent: null, weather: null, notes: "",
    recordedAt: new Date(),
    ...overrides,
  });
}

describe("OptimizationEngine", () => {
  const engine = new OptimizationEngine();

  it("generates peak capacity recommendations", () => {
    const snapshots = [
      makeSnapshot({ timeSlot: "dinner", occupancyRate: 0.92 }),
      makeSnapshot({ timeSlot: "dinner", occupancyRate: 0.88 }),
      makeSnapshot({ timeSlot: "lunch", occupancyRate: 0.4 }),
    ];
    const recs = engine.generateRecommendations(snapshots, testCapacity);
    expect(recs.length).toBeGreaterThanOrEqual(1);
    const peakRec = recs.find((r) => r.type === RecommendationType.IncreaseAvailability);
    expect(peakRec).toBeDefined();
    expect(peakRec!.title).toContain("peak");
  });

  it("generates low-demand promotion recommendations", () => {
    const snapshots = [
      makeSnapshot({ timeSlot: "lunch", occupancyRate: 0.3 }),
      makeSnapshot({ timeSlot: "lunch", occupancyRate: 0.25 }),
      makeSnapshot({ timeSlot: "dinner", occupancyRate: 0.85 }),
    ];
    const recs = engine.generateRecommendations(snapshots, testCapacity);
    const promoRec = recs.find((r) => r.type === RecommendationType.PromoteLowDemand);
    expect(promoRec).toBeDefined();
    expect(promoRec!.priority).toBe(RecommendationPriority.Medium);
  });

  it("generates table allocation recommendations", () => {
    const snapshots = [
      makeSnapshot({ averageDiningDurationMinutes: 120 }),
      makeSnapshot({ averageDiningDurationMinutes: 110 }),
    ];
    const recs = engine.generateRecommendations(snapshots, testCapacity);
    const allocRec = recs.find((r) => r.type === RecommendationType.OptimizeTableAllocation);
    expect(allocRec).toBeDefined();
  });
});
