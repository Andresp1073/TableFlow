import { describe, it, expect } from "vitest";
import { CapacityAnalyzer } from "../domain/services/CapacityAnalyzer.js";
import { RestaurantCapacity } from "../domain/models/RestaurantCapacity.js";

const testCapacity = RestaurantCapacity.reconstitute({
  id: "cap-1", restaurantId: "rest-1",
  diningAreas: [
    { id: "a1", name: "Main", capacity: 80, tableCount: 16, averageDiningDurationMinutes: 60, isActive: true },
    { id: "a2", name: "Bar", capacity: 30, tableCount: 6, averageDiningDurationMinutes: 45, isActive: true },
  ],
  totalCapacity: 110,
  maxCoversPerTimeSlot: { breakfast: 60, lunch: 110, dinner: 110, late_night: 40 },
  timeSlotDurations: { breakfast: 180, lunch: 240, dinner: 300, late_night: 180 },
  minPartySize: 1, maxPartySize: 20, isActive: true,
  createdAt: new Date(), updatedAt: new Date(),
});

describe("CapacityAnalyzer", () => {
  const analyzer = new CapacityAnalyzer();

  it("analyzes capacity", () => {
    const result = analyzer.analyze(testCapacity, 0.6);
    expect(result.totalCapacity).toBe(110);
    expect(result.activeAreas).toBe(2);
    expect(result.totalAreaCapacity).toBe(110);
    expect(result.estimatedTurnsPerSlot['lunch']).toBeGreaterThan(0);
  });

  it("detects unused capacity", () => {
    const result = analyzer.analyze(testCapacity, 0.3);
    expect(result.unusedCapacity).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("detects high occupancy", () => {
    const result = analyzer.analyze(testCapacity, 0.9);
    expect(result.recommendations.some((r) => r.includes("High occupancy"))).toBe(true);
  });

  it("checks if party can be accommodated", () => {
    expect(analyzer.canAccommodate(testCapacity, 4, 0.5, "lunch")).toBe(true);
    expect(analyzer.canAccommodate(testCapacity, 25, 0.5, "lunch")).toBe(false);
  });

  it("estimates table turn time", () => {
    const area = testCapacity.diningAreas[0]!;
    expect(analyzer.estimateTableTurnTime(area)).toBe(75);
  });

  it("calculates max covers", () => {
    const area = testCapacity.diningAreas[0]!;
    const covers = analyzer.calculateMaxCovers(area, 240);
    expect(covers).toBeGreaterThan(0);
  });
});
