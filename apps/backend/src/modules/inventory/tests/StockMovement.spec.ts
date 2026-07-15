import { describe, it, expect } from "vitest";
import { StockMovement, StockMovementType } from "../domain/models/StockMovement.js";
import { IngredientUnit } from "../domain/models/Ingredient.js";

describe("StockMovement", () => {
  it("creates a purchase movement", () => {
    const m = StockMovement.create({
      id: "m-1", restaurantId: "r-1", ingredientId: "i-1",
      stockItemId: "s-1", type: StockMovementType.Purchase,
      quantity: 50, unit: IngredientUnit.Kg, unitCost: 2.5,
      performedBy: "user-1",
    });
    expect(m.type).toBe(StockMovementType.Purchase);
    expect(m.totalCost).toBe(125);
    expect(m.isIncrease()).toBe(true);
  });

  it("creates a consumption movement", () => {
    const m = StockMovement.create({
      id: "m-2", restaurantId: "r-1", ingredientId: "i-1",
      stockItemId: "s-1", type: StockMovementType.Consumption,
      quantity: 5, unit: IngredientUnit.Kg, unitCost: 2.5,
      performedBy: "user-1",
    });
    expect(m.isDecrease()).toBe(true);
    expect(m.isIncrease()).toBe(false);
  });

  it("treats positive adjustment as increase", () => {
    const m = StockMovement.create({
      id: "m-3", restaurantId: "r-1", ingredientId: "i-1",
      stockItemId: "s-1", type: StockMovementType.Adjustment,
      quantity: 10, unit: IngredientUnit.Units, unitCost: 1,
      performedBy: "user-1",
    });
    expect(m.isIncrease()).toBe(true);
  });

  it("treats negative adjustment as decrease", () => {
    const m = StockMovement.create({
      id: "m-3n", restaurantId: "r-1", ingredientId: "i-1",
      stockItemId: "s-1", type: StockMovementType.Adjustment,
      quantity: -5, unit: IngredientUnit.Units, unitCost: 1,
      performedBy: "user-1",
    });
    expect(m.isDecrease()).toBe(true);
  });

  it("creates waste movement", () => {
    const m = StockMovement.create({
      id: "m-4", restaurantId: "r-1", ingredientId: "i-1",
      stockItemId: "s-1", type: StockMovementType.Waste,
      quantity: 2, unit: IngredientUnit.Kg, unitCost: 2.5,
      reason: "Spoiled", performedBy: "user-1",
    });
    expect(m.reason).toBe("Spoiled");
    expect(m.isDecrease()).toBe(true);
  });

  it("creates return and transfer movements", () => {
    const ret = StockMovement.create({
      id: "m-5", restaurantId: "r-1", ingredientId: "i-1",
      stockItemId: "s-1", type: StockMovementType.Return,
      quantity: 5, unit: IngredientUnit.Units, unitCost: 3,
      performedBy: "user-1",
    });
    expect(ret.isIncrease()).toBe(true);

    const trf = StockMovement.create({
      id: "m-6", restaurantId: "r-1", ingredientId: "i-1",
      stockItemId: "s-1", type: StockMovementType.Transfer,
      quantity: 10, unit: IngredientUnit.Units, unitCost: 0,
      performedBy: "user-1",
    });
    expect(trf.isDecrease()).toBe(true);
  });
});
