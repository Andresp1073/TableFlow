import { describe, it, expect } from "vitest";
import { PricingRule } from "../domain/models/PricingRule.js";
import { PricingEngine } from "../domain/services/PricingEngine.js";

function makeRule(overrides?: Record<string, unknown>): PricingRule {
  return PricingRule.reconstitute({
    id: "rule-1", restaurantId: "rest-1", name: "Happy Hour",
    description: "Early evening discount", conditions: {
      dayOfWeek: [1, 2, 3, 4, 5], timeSlot: ["dinner"],
      minOccupancy: undefined, maxOccupancy: 0.7,
      minPartySize: undefined, maxPartySize: undefined,
      isHoliday: undefined, specialEvent: undefined,
      leadTimeHours: undefined,
    },
    priceMultiplier: 0.85, priceDiscount: 0, minimumSpend: null,
    priority: 10, diningAreaIds: [],
    validFrom: new Date("2024-01-01"), validTo: null,
    maxApplicationsPerDay: null, applicationCount: 0,
    isActive: true, createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  });
}

describe("PricingRule", () => {
  it("creates a pricing rule", () => {
    const r = makeRule();
    expect(r.name).toBe("Happy Hour");
    expect(r.isApplicable(0.5, 2, 3, "dinner")).toBe(true);
  });

  it("rejects when above max occupancy", () => {
    const r = makeRule();
    expect(r.isApplicable(0.8, 2, 3, "dinner")).toBe(false);
  });

  it("rejects when inactive", () => {
    const r = makeRule({ isActive: false });
    expect(r.isApplicable(0.5, 2, 3, "dinner")).toBe(false);
  });

  it("rejects on wrong day", () => {
    const r = makeRule();
    expect(r.isApplicable(0.5, 2, 0, "dinner")).toBe(false);
  });

  it("rejects on wrong time slot", () => {
    const r = makeRule();
    expect(r.isApplicable(0.5, 2, 3, "breakfast")).toBe(false);
  });

  it("rejects when max applications reached", () => {
    const r = makeRule({ maxApplicationsPerDay: 5, applicationCount: 5 });
    expect(r.isApplicable(0.5, 2, 3, "dinner")).toBe(false);
  });

  it("calculates effective price", () => {
    const r = makeRule({ priceMultiplier: 0.85 });
    expect(r.getEffectivePrice(100)).toBe(85);
  });

  it("records application", () => {
    const r = makeRule({ applicationCount: 0 });
    const updated = r.recordApplication();
    expect(updated.applicationCount).toBe(1);
  });

  it("activates and deactivates", () => {
    const r = makeRule();
    expect(r.deactivate().isActive).toBe(false);
    expect(r.activate().isActive).toBe(true);
  });
});

describe("PricingEngine", () => {
  const engine = new PricingEngine();

  it("finds best rule by priority", () => {
    const r1 = makeRule({ id: "r1", priority: 5 });
    const r2 = makeRule({ id: "r2", priority: 10 });
    const best = engine.findBestRule([r1, r2], 0.5, 2, 3, "dinner");
    expect(best?.id).toBe("r2");
  });

  it("returns null when no rule applies", () => {
    const r = makeRule({ conditions: { maxOccupancy: 0.3 } });
    const best = engine.findBestRule([r], 0.8, 2, 3, "dinner");
    expect(best).toBeNull();
  });

  it("calculates price with no applicable rule", () => {
    const result = engine.calculatePrice(100, [], 0.5, 2, 3, "dinner");
    expect(result.price).toBe(100);
    expect(result.appliedRule).toBeNull();
  });

  it("calculates price with applicable rule", () => {
    const r = makeRule({ priceMultiplier: 0.85 });
    const result = engine.calculatePrice(100, [r], 0.5, 2, 3, "dinner");
    expect(result.price).toBe(85);
    expect(result.appliedRule).not.toBeNull();
  });

  it("recommends price adjustments based on occupancy", () => {
    const low = engine.recommendAdjustment(0.3, 0.7);
    expect(low.multiplier).toBeLessThan(1);

    const high = engine.recommendAdjustment(0.9, 0.7);
    expect(high.multiplier).toBeGreaterThan(1);

    const normal = engine.recommendAdjustment(0.7, 0.7);
    expect(normal.multiplier).toBe(1);
  });
});
