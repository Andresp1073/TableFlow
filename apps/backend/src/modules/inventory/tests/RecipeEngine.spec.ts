import { describe, it, expect } from "vitest";
import { Recipe } from "../domain/models/Recipe.js";
import { RecipeEngine } from "../domain/services/RecipeEngine.js";
import { IngredientUnit } from "../domain/models/Ingredient.js";

describe("RecipeEngine", () => {
  const engine = new RecipeEngine();

  const burgerRecipe = Recipe.create({
    id: "recipe-1",
    restaurantId: "rest-1",
    name: "Classic Burger",
    servings: 1,
    ingredients: [
      { ingredientId: "beef-1", ingredientName: "Ground Beef", quantity: 0.2, unit: IngredientUnit.Kg, wastePercent: 5 },
      { ingredientId: "bun-1", ingredientName: "Burger Bun", quantity: 1, unit: IngredientUnit.Units, wastePercent: 0 },
      { ingredientId: "cheese-1", ingredientName: "Cheese Slice", quantity: 1, unit: IngredientUnit.Units, wastePercent: 0 },
    ],
    estimatedPrepTimeMinutes: 15,
    isActive: true,
  });

  const costs = new Map([
    ["beef-1", { name: "Ground Beef", costPerUnit: 8 }],
    ["bun-1", { name: "Burger Bun", costPerUnit: 0.5 }],
    ["cheese-1", { name: "Cheese Slice", costPerUnit: 0.3 }],
  ]);

  it("calculates consumption for recipe", () => {
    const result = engine.calculateConsumption(burgerRecipe, 1, costs);
    expect(result.servings).toBe(1);
    expect(result.consumed).toHaveLength(3);
    expect(result.totalCost).toBeCloseTo(2.4, 1);
    expect(result.costPerServing).toBeCloseTo(result.totalCost, 1);
  });

  it("scales consumption for multiple servings", () => {
    const result = engine.calculateConsumption(burgerRecipe, 10, costs);
    expect(result.servings).toBe(10);
    expect(result.totalCost).toBeCloseTo(24, 1);
  });

  it("checks stock availability", () => {
    const stock = new Map([
      ["beef-1", 1],
      ["bun-1", 5],
      ["cheese-1", 0],
    ]);
    const checks = engine.checkStockAvailability(burgerRecipe, 3, stock);
    expect(checks.find((c) => c.ingredientId === "cheese-1")?.sufficient).toBe(false);
    expect(checks.find((c) => c.ingredientId === "beef-1")?.sufficient).toBe(true);
  });

  it("determines if order can be fulfilled", () => {
    const sufficient = new Map([["beef-1", 10], ["bun-1", 10], ["cheese-1", 10]]);
    const insufficient = new Map([["beef-1", 0], ["bun-1", 10], ["cheese-1", 10]]);
    expect(engine.canFulfill(burgerRecipe, 1, sufficient)).toBe(true);
    expect(engine.canFulfill(burgerRecipe, 1, insufficient)).toBe(false);
  });

  it("calculates required purchases", () => {
    const stock = new Map([["beef-1", 0.1], ["bun-1", 10], ["cheese-1", 0]]);
    const purchases = engine.calculateRequiredPurchases(burgerRecipe, 1, stock, new Map());
    expect(purchases).toHaveLength(2);
    expect(purchases.find((p) => p.ingredientId === "beef-1")).toBeDefined();
    expect(purchases.find((p) => p.ingredientId === "cheese-1")?.quantity).toBeGreaterThan(0);
  });
});

describe("Recipe", () => {
  it("calculates ingredient cost", () => {
    const recipe = Recipe.create({
      id: "r-1", restaurantId: "rest-1", name: "Test",
      servings: 1,
      ingredients: [
        { ingredientId: "i-1", ingredientName: "A", quantity: 2, unit: IngredientUnit.Units, wastePercent: 0 },
      ],
      estimatedPrepTimeMinutes: 5, isActive: true,
    });
    const costs = new Map([["i-1", 1.5]]);
    expect(recipe.calculateIngredientCost(costs)).toBe(3);
  });

  it("scales ingredients for target servings", () => {
    const recipe = Recipe.create({
      id: "r-1", restaurantId: "rest-1", name: "Test",
      servings: 2,
      ingredients: [
        { ingredientId: "i-1", ingredientName: "A", quantity: 1, unit: IngredientUnit.Units, wastePercent: 0 },
      ],
      estimatedPrepTimeMinutes: 5, isActive: true,
    });
    const scaled = recipe.scaleIngredients(4);
    expect(scaled[0].quantity).toBe(2);
  });

  it("gets required ingredients with waste", () => {
    const recipe = Recipe.create({
      id: "r-1", restaurantId: "rest-1", name: "Test",
      servings: 1,
      ingredients: [
        { ingredientId: "i-1", ingredientName: "A", quantity: 1, unit: IngredientUnit.Kg, wastePercent: 10 },
      ],
      estimatedPrepTimeMinutes: 5, isActive: true,
    });
    const required = recipe.getRequiredIngredients(5);
    expect(required.get("i-1")).toBeCloseTo(5.5, 1);
  });
});
