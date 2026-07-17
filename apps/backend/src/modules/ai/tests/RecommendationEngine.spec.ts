import { describe, it, expect } from "vitest";
import { RecommendationEngine, TableAllocationStrategy, PricingStrategy, InventoryPurchasingStrategy, CustomerOfferStrategy, MenuOptimizationStrategy, StaffPlanningStrategy } from "../domain/services/RecommendationEngine.js";
import { Recommendation } from "../domain/models/Recommendation.js";

describe("RecommendationEngine", () => {
  const engine = new RecommendationEngine();

  it("registers all 6 default strategies", () => {
    const types = engine.listTypes();
    expect(types).toContain("table_allocation");
    expect(types).toContain("pricing");
    expect(types).toContain("inventory_purchasing");
    expect(types).toContain("customer_offer");
    expect(types).toContain("menu_optimization");
    expect(types).toContain("staff_planning");
    expect(types.length).toBe(6);
  });

  const baseParams = {
    restaurantId: "rest-1",
    priority: "high" as const,
    title: "Test Recommendation",
    description: "A test recommendation",
    reasoning: "Based on data analysis",
    expectedImpact: "Improvement expected",
    confidence: 0.85,
    source: "test",
    data: { key: "value" },
    createdBy: "system",
  };

  it("generates a table_allocation recommendation", () => {
    const rec = engine.generate({ ...baseParams, type: "table_allocation" });
    expect(rec).toBeInstanceOf(Recommendation);
    expect(rec.type).toBe("table_allocation");
    expect(rec.priority).toBe("high");
    expect(rec.confidence).toBe(0.85);
  });

  it("generates a pricing recommendation", () => {
    const rec = engine.generate({ ...baseParams, type: "pricing" });
    expect(rec.type).toBe("pricing");
  });

  it("generates an inventory_purchasing recommendation", () => {
    const rec = engine.generate({ ...baseParams, type: "inventory_purchasing" });
    expect(rec.type).toBe("inventory_purchasing");
  });

  it("generates a customer_offer recommendation", () => {
    const rec = engine.generate({ ...baseParams, type: "customer_offer" });
    expect(rec.type).toBe("customer_offer");
  });

  it("generates a menu_optimization recommendation", () => {
    const rec = engine.generate({ ...baseParams, type: "menu_optimization" });
    expect(rec.type).toBe("menu_optimization");
  });

  it("generates a staff_planning recommendation", () => {
    const rec = engine.generate({ ...baseParams, type: "staff_planning" });
    expect(rec.type).toBe("staff_planning");
  });

  it("throws for unknown recommendation type", () => {
    expect(() =>
      engine.generate({ ...baseParams, type: "unknown" as never }),
    ).toThrow("No recommendation strategy for type: unknown");
  });

  it("generates all recommendation types via generateAll", () => {
    const recs = engine.generateAll(baseParams);
    expect(recs.length).toBe(6);
    const types = recs.map((r) => r.type);
    expect(types).toContain("table_allocation");
    expect(types).toContain("pricing");
    expect(types).toContain("inventory_purchasing");
    expect(types).toContain("customer_offer");
    expect(types).toContain("menu_optimization");
    expect(types).toContain("staff_planning");
  });

  it("hasStrategy returns correct status", () => {
    expect(engine.hasStrategy("pricing")).toBe(true);
    expect(engine.hasStrategy("nonexistent")).toBe(false);
  });

  it("allows registering custom strategies", () => {
    const custom = new (class implements import("../domain/services/RecommendationEngine.js").RecommendationStrategy {
      readonly type = "custom_test" as never;
      generate(params: import("../domain/services/RecommendationEngine.js").RecommendationParams): Recommendation {
        return Recommendation.create({
          id: "custom-1", restaurantId: params.restaurantId,
          type: this.type, priority: params.priority,
          title: params.title, description: params.description,
          reasoning: params.reasoning, expectedImpact: params.expectedImpact,
          confidence: params.confidence, source: params.source,
          createdBy: params.createdBy, metadata: params.data,
        });
      }
    })();
    engine.register(custom);
    expect(engine.hasStrategy("custom_test")).toBe(true);
  });

  it("individual strategy metadata", () => {
    expect(new TableAllocationStrategy().type).toBe("table_allocation");
    expect(new PricingStrategy().type).toBe("pricing");
    expect(new InventoryPurchasingStrategy().type).toBe("inventory_purchasing");
    expect(new CustomerOfferStrategy().type).toBe("customer_offer");
    expect(new MenuOptimizationStrategy().type).toBe("menu_optimization");
    expect(new StaffPlanningStrategy().type).toBe("staff_planning");
  });
});
