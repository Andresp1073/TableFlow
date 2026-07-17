import { describe, it, expect } from "vitest";
import { ForecastEngine, DemandForecastStrategy, OccupancyForecastStrategy, RevenueForecastStrategy, InventoryForecastStrategy, StaffingForecastStrategy, ReservationForecastStrategy } from "../domain/services/ForecastEngine.js";
import { Forecast } from "../domain/models/Forecast.js";

describe("ForecastEngine", () => {
  const engine = new ForecastEngine();

  it("registers all 6 default strategies", () => {
    const types = engine.listTypes();
    expect(types).toContain("demand");
    expect(types).toContain("occupancy");
    expect(types).toContain("revenue");
    expect(types).toContain("inventory");
    expect(types).toContain("staffing");
    expect(types).toContain("reservation");
    expect(types.length).toBe(6);
  });

  it("generates a demand forecast", () => {
    const forecast = engine.generate({
      restaurantId: "rest-1",
      type: "demand",
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-31"),
      historicalValues: [100, 120, 110, 130, 105, 115, 125],
      createdBy: "system",
    });
    expect(forecast).toBeInstanceOf(Forecast);
    expect(forecast.type).toBe("demand");
    expect(forecast.unit).toBe("covers");
    expect(forecast.value).toBeGreaterThan(0);
    expect(forecast.historicalDataPoints).toBe(7);
  });

  it("generates an occupancy forecast", () => {
    const forecast = engine.generate({
      restaurantId: "rest-1",
      type: "occupancy",
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-31"),
      historicalValues: [75, 80, 85, 70, 90, 78, 82],
      createdBy: "system",
    });
    expect(forecast.unit).toBe("percentage");
    expect(forecast.value).toBeGreaterThan(0);
  });

  it("generates a revenue forecast", () => {
    const forecast = engine.generate({
      restaurantId: "rest-1",
      type: "revenue",
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-31"),
      historicalValues: [5000, 5500, 4800, 6000, 5200],
      createdBy: "system",
    });
    expect(forecast.unit).toBe("usd");
    expect(forecast.value).toBeGreaterThan(0);
  });

  it("generates an inventory forecast", () => {
    const forecast = engine.generate({
      restaurantId: "rest-1",
      type: "inventory",
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-31"),
      historicalValues: [200, 180, 220, 190, 210],
      createdBy: "system",
    });
    expect(forecast.unit).toBe("units");
    expect(forecast.value).toBeGreaterThan(0);
  });

  it("generates a staffing forecast", () => {
    const forecast = engine.generate({
      restaurantId: "rest-1",
      type: "staffing",
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-31"),
      historicalValues: [40, 45, 38, 42, 44],
      createdBy: "system",
    });
    expect(forecast.unit).toBe("hours");
    expect(forecast.value).toBeGreaterThan(0);
  });

  it("generates a reservation forecast", () => {
    const forecast = engine.generate({
      restaurantId: "rest-1",
      type: "reservation",
      periodStart: new Date("2026-07-01"),
      periodEnd: new Date("2026-07-31"),
      historicalValues: [30, 35, 28, 40, 33],
      createdBy: "system",
    });
    expect(forecast.unit).toBe("count");
    expect(forecast.value).toBeGreaterThan(0);
  });

  it("throws for unknown forecast type", () => {
    expect(() =>
      engine.generate({
        restaurantId: "rest-1",
        type: "unknown" as never,
        periodStart: new Date(),
        periodEnd: new Date(),
        historicalValues: [],
        createdBy: "system",
      }),
    ).toThrow("No forecast strategy for type: unknown");
  });

  it("generates multiple forecasts via generateMultiple", () => {
    const forecasts = engine.generateMultiple([
      {
        restaurantId: "rest-1",
        type: "demand" as const,
        periodStart: new Date("2026-07-01"),
        periodEnd: new Date("2026-07-31"),
        historicalValues: [100, 110],
        createdBy: "system",
      },
      {
        restaurantId: "rest-1",
        type: "revenue" as const,
        periodStart: new Date("2026-07-01"),
        periodEnd: new Date("2026-07-31"),
        historicalValues: [5000, 5500],
        createdBy: "system",
      },
    ]);
    expect(forecasts.length).toBe(2);
    expect(forecasts[0].type).toBe("demand");
    expect(forecasts[1].type).toBe("revenue");
  });

  it("hasStrategy returns correct status", () => {
    expect(engine.hasStrategy("demand")).toBe(true);
    expect(engine.hasStrategy("nonexistent")).toBe(false);
  });

  it("allows registering custom strategies", () => {
    const custom = new (class implements import("../domain/services/ForecastEngine.js").ForecastStrategy {
      readonly type = "custom_test" as never;
      readonly unit = "test_units";
      generate() {
        return { value: 42, confidence: "high" as const, factors: [] };
      }
    })();
    engine.register(custom);
    expect(engine.hasStrategy("custom_test")).toBe(true);
  });

  it("DemandForecastStrategy calculates confidence based on data points", () => {
    const strategy = new DemandForecastStrategy();
    const high = strategy.generate({
      restaurantId: "rest-1", type: "demand",
      periodStart: new Date(), periodEnd: new Date(),
      historicalValues: Array.from({ length: 30 }, (_, i) => i + 1),
      createdBy: "system",
    });
    expect(high.confidence).toBe("high");

    const low = strategy.generate({
      restaurantId: "rest-1", type: "demand",
      periodStart: new Date(), periodEnd: new Date(),
      historicalValues: [1, 2, 3],
      createdBy: "system",
    });
    expect(low.confidence).toBe("very_low");
  });

  it("individual strategy metadata", () => {
    expect(new DemandForecastStrategy().type).toBe("demand");
    expect(new OccupancyForecastStrategy().type).toBe("occupancy");
    expect(new RevenueForecastStrategy().type).toBe("revenue");
    expect(new InventoryForecastStrategy().type).toBe("inventory");
    expect(new StaffingForecastStrategy().type).toBe("staffing");
    expect(new ReservationForecastStrategy().type).toBe("reservation");
  });
});
