import { describe, it, expect } from "vitest";
import { StockCalculator } from "../domain/services/StockCalculator.js";
import { StockItem } from "../domain/models/StockItem.js";
import { IngredientUnit } from "../domain/models/Ingredient.js";
import { StockMovement, StockMovementType } from "../domain/models/StockMovement.js";

function createItem(id: string, ingredientId: string, qty: number, cost: number): StockItem {
  return StockItem.reconstitute({
    id, restaurantId: "r-1", ingredientId, quantity: qty,
    unit: IngredientUnit.Kg, receivedAt: new Date(),
    expiresAt: null, costAtReceipt: cost, isActive: true,
  });
}

describe("StockCalculator", () => {
  const calc = new StockCalculator();

  it("calculates total stock", () => {
    const items = [createItem("s1", "i1", 10, 5), createItem("s2", "i1", 20, 6)];
    expect(calc.calculateTotalStock(items)).toBe(30);
  });

  it("calculates total value", () => {
    const items = [createItem("s1", "i1", 10, 5), createItem("s2", "i1", 20, 6)];
    expect(calc.calculateTotalValue(items)).toBe(170);
  });

  it("calculates average cost", () => {
    const items = [createItem("s1", "i1", 10, 5), createItem("s2", "i1", 20, 8)];
    expect(calc.calculateAverageCost(items)).toBeCloseTo(7, 0);
  });

  it("summarizes stock by ingredient", () => {
    const items = [
      createItem("s1", "beef", 10, 5),
      createItem("s2", "beef", 20, 6),
      createItem("s3", "bun", 100, 0.5),
    ];
    const summaries = calc.summarizeStock(items);
    expect(summaries).toHaveLength(2);
    const beef = summaries.find((s) => s.ingredientId === "beef");
    expect(beef?.totalQuantity).toBe(30);
  });

  it("calculates movement totals by type", () => {
    const movements = [
      StockMovement.create({ id: "m1", restaurantId: "r-1", ingredientId: "i1", stockItemId: "s1", type: StockMovementType.Consumption, quantity: 5, unit: IngredientUnit.Kg, unitCost: 0, performedBy: "u1" }),
      StockMovement.create({ id: "m2", restaurantId: "r-1", ingredientId: "i1", stockItemId: "s1", type: StockMovementType.Consumption, quantity: 3, unit: IngredientUnit.Kg, unitCost: 0, performedBy: "u1" }),
      StockMovement.create({ id: "m3", restaurantId: "r-1", ingredientId: "i1", stockItemId: "s1", type: StockMovementType.Waste, quantity: 2, unit: IngredientUnit.Kg, unitCost: 0, performedBy: "u1" }),
    ];
    expect(calc.calculateMovementTotal("i1", movements, StockMovementType.Consumption)).toBe(8);
    expect(calc.calculateMovementTotal("i1", movements, StockMovementType.Waste)).toBe(2);
  });
});
