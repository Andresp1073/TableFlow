import { describe, it, expect } from "vitest";
import { ForecastService } from "../domain/services/ForecastService.js";
import { DemandSnapshot } from "../domain/models/DemandSnapshot.js";
import { RestaurantCapacity } from "../domain/models/RestaurantCapacity.js";
import { ForecastConfidence } from "../domain/models/OccupancyForecast.js";

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
    timeSlot: "dinner", reservationVolume: 60, walkInVolume: 15,
    turnawayCount: 5, occupancyRate: 0.75, totalCapacity: 100,
    coversServed: 75, averagePartySize: 3,
    averageDiningDurationMinutes: 70, revenueGenerated: 3000,
    isHoliday: false, specialEvent: null, weather: null, notes: "",
    recordedAt: new Date(),
    ...overrides,
  });
}

describe("ForecastService", () => {
  const service = new ForecastService();

  it("generates forecast with sufficient data", () => {
    const snapshots = Array.from({ length: 20 }, (_, i) =>
      makeSnapshot({ occupancyRate: 0.7 + Math.random() * 0.1 }),
    );
    const forecast = service.generateOccupancyForecast(snapshots, testCapacity, "2026-07-20", "dinner");
    expect(forecast.predictedOccupancyRate).toBeGreaterThan(0.5);
    expect(forecast.date).toBe("2026-07-20");
    expect(forecast.timeSlot).toBe("dinner");
  });

  it("uses very low confidence with minimal data", () => {
    const snapshots = [makeSnapshot()];
    const forecast = service.generateOccupancyForecast(snapshots, testCapacity, "2026-07-20", "dinner");
    expect(forecast.confidence).toBe(ForecastConfidence.VeryLow);
  });

  it("uses high confidence with 30+ data points", () => {
    const snapshots = Array.from({ length: 30 }, (_, i) =>
      makeSnapshot({ occupancyRate: 0.75 }),
    );
    const forecast = service.generateOccupancyForecast(snapshots, testCapacity, "2026-07-20", "dinner");
    expect(forecast.confidence).toBe(ForecastConfidence.High);
  });

  it("returns range bounds", () => {
    const snapshots = Array.from({ length: 10 }, (_, i) =>
      makeSnapshot({ occupancyRate: 0.7 + (i % 3) * 0.1 }),
    );
    const forecast = service.generateOccupancyForecast(snapshots, testCapacity, "2026-07-20", "dinner");
    expect(forecast.lowerBound).toBeLessThan(forecast.upperBound);
  });

  it("aggregates forecasts", () => {
    const forecasts = Array.from({ length: 3 }, (_, i) =>
      service.generateOccupancyForecast(
        [makeSnapshot({ occupancyRate: 0.6 + i * 0.1 })],
        testCapacity, "2026-07-20", i === 0 ? "lunch" : i === 1 ? "dinner" : "breakfast",
      ),
    );
    const agg = service.aggregateForecasts(forecasts);
    expect(agg.averageOccupancy).toBeGreaterThan(0);
    expect(agg.totalPredictedRevenue).toBeGreaterThan(0);
    expect(agg.bestSlot).not.toBe("");
  });
});
