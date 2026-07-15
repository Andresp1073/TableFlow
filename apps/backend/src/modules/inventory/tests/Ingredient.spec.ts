import { describe, it, expect } from "vitest";
import { Ingredient, IngredientCategory, IngredientUnit } from "../domain/models/Ingredient.js";

describe("Ingredient", () => {
  it("creates a raw material ingredient", () => {
    const ing = Ingredient.create({
      id: "beef-1", restaurantId: "rest-1", name: "Ground Beef",
      category: IngredientCategory.RawMaterial, unit: IngredientUnit.Kg,
      costPerUnit: 8, perishable: true, shelfLifeDays: 7,
      isActive: true,
    });
    expect(ing.category).toBe(IngredientCategory.RawMaterial);
    expect(ing.shelfLifeDays).toBe(7);
    expect(ing.perishable).toBe(true);
  });

  it("rejects negative cost", () => {
    expect(() => Ingredient.create({
      id: "bad", restaurantId: "r-1", name: "Bad",
      category: IngredientCategory.Consumable, unit: IngredientUnit.Units,
      costPerUnit: -1, perishable: false, isActive: true,
    })).toThrow("Cost per unit cannot be negative");
  });

  it("updates cost", () => {
    const ing = Ingredient.create({
      id: "i-1", restaurantId: "r-1", name: "Item",
      category: IngredientCategory.RawMaterial, unit: IngredientUnit.Kg,
      costPerUnit: 5, perishable: false, isActive: true,
    });
    expect(ing.updateCost(6).costPerUnit).toBe(6);
  });

  it("activates and deactivates", () => {
    const ing = Ingredient.create({
      id: "i-1", restaurantId: "r-1", name: "Item",
      category: IngredientCategory.Packaging, unit: IngredientUnit.Boxes,
      costPerUnit: 10, perishable: false, isActive: true,
    });
    expect(ing.deactivate().isActive).toBe(false);
    expect(ing.activate().isActive).toBe(true);
  });
});
