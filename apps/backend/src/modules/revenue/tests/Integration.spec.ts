import { describe, it, expect } from "vitest";
import { RevenueManager } from "../application/services/RevenueManager.js";
import {
  InMemoryDemandSnapshotRepository,
  InMemoryRevenueStrategyRepository,
  InMemoryCapacityRepository,
  InMemoryRevenueAnalyticsRepository,
} from "../infrastructure/repositories/InMemoryRevenueRepositories.js";
import { DemandSnapshot } from "../domain/models/DemandSnapshot.js";
import { RestaurantCapacity } from "../domain/models/RestaurantCapacity.js";
import { PricingRule } from "../domain/models/PricingRule.js";
import { RevenueMetric } from "../domain/models/RevenueMetric.js";

describe("Revenue Integration", () => {
  it("records demand and analyzes it", async () => {
    const demandRepo = new InMemoryDemandSnapshotRepository();
    const strategyRepo = new InMemoryRevenueStrategyRepository();
    const capacityRepo = new InMemoryCapacityRepository();
    const analyticsRepo = new InMemoryRevenueAnalyticsRepository();

    const manager = new RevenueManager(demandRepo, strategyRepo, capacityRepo, analyticsRepo);

    const capacity = RestaurantCapacity.create({
      id: "cap-1", restaurantId: "rest-1",
      diningAreas: [{ id: "a1", name: "Main", capacity: 100, tableCount: 20, averageDiningDurationMinutes: 60, isActive: true }],
      totalCapacity: 100,
      maxCoversPerTimeSlot: { breakfast: 50, lunch: 100, dinner: 100, late_night: 40 },
      timeSlotDurations: { breakfast: 180, lunch: 240, dinner: 300, late_night: 180 },
      minPartySize: 1, maxPartySize: 20,
    });
    await capacityRepo.save(capacity);

    const s1 = DemandSnapshot.create({
      id: "ds-1", restaurantId: "rest-1", date: "2026-07-15", timeSlot: "dinner",
      reservationVolume: 70, walkInVolume: 20, turnawayCount: 10,
      occupancyRate: 0.85, totalCapacity: 100, coversServed: 85,
      averagePartySize: 3.5, averageDiningDurationMinutes: 75,
      revenueGenerated: 4000, isHoliday: false, specialEvent: null,
      weather: null, notes: "",
    });
    await manager.recordDemand(s1);

    const s2 = DemandSnapshot.create({
      id: "ds-2", restaurantId: "rest-1", date: "2026-07-15", timeSlot: "lunch",
      reservationVolume: 30, walkInVolume: 15, turnawayCount: 2,
      occupancyRate: 0.45, totalCapacity: 100, coversServed: 45,
      averagePartySize: 2.5, averageDiningDurationMinutes: 50,
      revenueGenerated: 1500, isHoliday: false, specialEvent: null,
      weather: null, notes: "",
    });
    await manager.recordDemand(s2);

    const analysis = await manager.analyzeDemand("rest-1");
    expect(analysis.summary.totalReservations).toBe(100);
    expect(analysis.summary.totalWalkIns).toBe(35);
    expect(analysis.summary.peakSlot).toBe("dinner");
    expect(analysis.summary.lowSlot).toBe("lunch");
    expect(analysis.opportunities.length).toBeGreaterThan(0);
  });

  it("calculates price with pricing rules", async () => {
    const demandRepo = new InMemoryDemandSnapshotRepository();
    const strategyRepo = new InMemoryRevenueStrategyRepository();
    const capacityRepo = new InMemoryCapacityRepository();
    const analyticsRepo = new InMemoryRevenueAnalyticsRepository();

    const manager = new RevenueManager(demandRepo, strategyRepo, capacityRepo, analyticsRepo);

    const rule = PricingRule.create({
      id: "rule-1", restaurantId: "rest-1", name: "Off-Peak Discount",
      description: "Discount for low occupancy", conditions: {
        maxOccupancy: 0.5, dayOfWeek: [1, 2, 3, 4, 5, 6, 0],
        timeSlot: ["lunch"],
      },
      priceMultiplier: 0.8, priceDiscount: 0, minimumSpend: null,
      priority: 10, diningAreaIds: [],
      validFrom: new Date("2024-01-01"), validTo: null,
      maxApplicationsPerDay: null,
    });
    await manager.createPricingRule(rule);

    const priceResult = await manager.calculatePrice({
      restaurantId: "rest-1", basePrice: 100,
      occupancyRate: 0.3, partySize: 2,
      dayOfWeek: 3, timeSlot: "lunch",
    });
    expect(priceResult.price).toBe(80);
    expect(priceResult.appliedRule).not.toBeNull();
  });

  it("generates forecasts and recommendations", async () => {
    const demandRepo = new InMemoryDemandSnapshotRepository();
    const strategyRepo = new InMemoryRevenueStrategyRepository();
    const capacityRepo = new InMemoryCapacityRepository();
    const analyticsRepo = new InMemoryRevenueAnalyticsRepository();

    const manager = new RevenueManager(demandRepo, strategyRepo, capacityRepo, analyticsRepo);

    const capacity = RestaurantCapacity.create({
      id: "cap-1", restaurantId: "rest-1",
      diningAreas: [{ id: "a1", name: "Main", capacity: 100, tableCount: 20, averageDiningDurationMinutes: 60, isActive: true }],
      totalCapacity: 100,
      maxCoversPerTimeSlot: { breakfast: 50, lunch: 100, dinner: 100, late_night: 40 },
      timeSlotDurations: { breakfast: 180, lunch: 240, dinner: 300, late_night: 180 },
      minPartySize: 1, maxPartySize: 20,
    });
    await capacityRepo.save(capacity);

    for (let i = 0; i < 14; i++) {
      const s = DemandSnapshot.create({
        id: `ds-hist-${i}`, restaurantId: "rest-1",
        date: `2026-07-${String(i + 1).padStart(2, "0")}`,
        timeSlot: i < 7 ? "dinner" : "lunch",
        reservationVolume: i < 7 ? 70 : 30,
        walkInVolume: i < 7 ? 15 : 10,
        turnawayCount: i < 7 ? 8 : 2,
        occupancyRate: i < 7 ? 0.85 : 0.40,
        totalCapacity: 100, coversServed: i < 7 ? 80 : 35,
        averagePartySize: 3.2, averageDiningDurationMinutes: 70,
        revenueGenerated: i < 7 ? 4000 : 1200,
        isHoliday: false, specialEvent: null, weather: null, notes: "",
      });
      await demandRepo.save(s);
    }

    const forecast = await manager.generateForecast("rest-1", "2026-07-20", "dinner");
    expect(forecast.predictedOccupancyRate).toBeGreaterThan(0.5);

    const recs = await manager.generateRecommendations("rest-1");
    expect(recs.length).toBeGreaterThan(0);
  });
});
