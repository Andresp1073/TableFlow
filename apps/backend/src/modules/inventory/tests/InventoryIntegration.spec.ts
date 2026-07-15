import { describe, it, expect } from "vitest";
import { InventoryManager } from "../application/services/InventoryManager.js";
import { PurchasingService } from "../application/services/PurchasingService.js";
import { InMemoryStockItemRepository, InMemoryIngredientRepository, InMemoryPurchaseOrderRepository } from "../infrastructure/repositories/InMemoryInventoryRepositories.js";
import { Ingredient, IngredientCategory, IngredientUnit } from "../domain/models/Ingredient.js";
import { Recipe } from "../domain/models/Recipe.js";
import { PurchaseOrderStatus } from "../domain/models/PurchaseOrder.js";

describe("Inventory Integration", () => {
  it("processes complete stock and consumption lifecycle", async () => {
    const stockRepo = new InMemoryStockItemRepository();
    const ingredientRepo = new InMemoryIngredientRepository();
    const poRepo = new InMemoryPurchaseOrderRepository();

    const inventory = new InventoryManager(stockRepo, ingredientRepo);
    const purchasing = new PurchasingService(poRepo, stockRepo);

    const beef = Ingredient.create({
      id: "beef-1", restaurantId: "rest-1", name: "Ground Beef",
      category: IngredientCategory.RawMaterial, unit: IngredientUnit.Kg,
      costPerUnit: 8, perishable: true, shelfLifeDays: 7, isActive: true,
    });
    await ingredientRepo.save(beef);

    const result = await inventory.addStock({
      restaurantId: "rest-1", ingredientId: "beef-1",
      quantity: 50, unit: IngredientUnit.Kg,
      costAtReceipt: 8, performedBy: "user-1",
    });
    expect(result.stockItem.quantity).toBe(50);

    const consumption = await inventory.consumeStock({
      restaurantId: "rest-1", ingredientId: "beef-1",
      quantity: 10, unit: IngredientUnit.Kg, performedBy: "chef-1",
    });
    expect(consumption.type).toBe("consumption");

    const item = await stockRepo.findByIngredient("beef-1");
    expect(item[0].quantity).toBe(40);

    const po = await purchasing.createPurchaseOrder({
      id: "po-int-1", restaurantId: "rest-1",
      supplierId: "sup-1", supplierName: "Meat Co",
      items: [{ ingredientId: "beef-1", ingredientName: "Ground Beef", quantity: 50, unit: IngredientUnit.Kg, unitCost: 8.5 }],
      notes: "Reorder", createdBy: "user-1",
    });
    expect(po.status).toBe(PurchaseOrderStatus.Draft);

    const submitted = await purchasing.submitOrder("po-int-1");
    expect(submitted.status).toBe(PurchaseOrderStatus.Submitted);

    const approved = await purchasing.approveOrder("po-int-1", "manager-1");
    expect(approved.status).toBe(PurchaseOrderStatus.Approved);

    const received = await purchasing.receiveOrder("po-int-1", [
      { ingredientId: "beef-1", receivedQuantity: 50 },
    ]);
    expect(received.status).toBe(PurchaseOrderStatus.Received);

    const stockAfter = await stockRepo.findByIngredient("beef-1");
    const totalQty = stockAfter.reduce((s, i) => s + i.quantity, 0);
    expect(totalQty).toBe(90);
  });

  it("handles stock adjustments and waste", async () => {
    const stockRepo = new InMemoryStockItemRepository();
    const ingredientRepo = new InMemoryIngredientRepository();
    const inventory = new InventoryManager(stockRepo, ingredientRepo);

    await inventory.addStock({
      restaurantId: "rest-1", ingredientId: "cheese-1",
      quantity: 20, unit: IngredientUnit.Units,
      costAtReceipt: 0.3, performedBy: "user-1",
    });

    const items = await stockRepo.findByIngredient("cheese-1");
    await inventory.adjustStock({
      restaurantId: "rest-1", stockItemId: items[0].id,
      newQuantity: 15, performedBy: "user-1", reason: "Inventory count correction",
    });

    const adjusted = await stockRepo.findById(items[0].id);
    expect(adjusted?.quantity).toBe(15);

    await inventory.recordWaste({
      restaurantId: "rest-1", ingredientId: "cheese-1",
      quantity: 3, unit: IngredientUnit.Units,
      reason: "Mold found", performedBy: "user-1",
    });

    const afterWaste = await stockRepo.findByIngredient("cheese-1");
    expect(afterWaste[0].quantity).toBe(12);
  });

  it("checks recipe stock availability", async () => {
    const stockRepo = new InMemoryStockItemRepository();
    const ingredientRepo = new InMemoryIngredientRepository();
    const inventory = new InventoryManager(stockRepo, ingredientRepo);

    await ingredientRepo.save(Ingredient.create({
      id: "beef-1", restaurantId: "rest-1", name: "Beef",
      category: IngredientCategory.RawMaterial, unit: IngredientUnit.Kg,
      costPerUnit: 8, perishable: true, isActive: true,
    }));
    await ingredientRepo.save(Ingredient.create({
      id: "bun-1", restaurantId: "rest-1", name: "Bun",
      category: IngredientCategory.FinishedProduct, unit: IngredientUnit.Units,
      costPerUnit: 0.5, perishable: false, isActive: true,
    }));

    await inventory.addStock({
      restaurantId: "rest-1", ingredientId: "beef-1",
      quantity: 2, unit: IngredientUnit.Kg, costAtReceipt: 8, performedBy: "u1",
    });
    await inventory.addStock({
      restaurantId: "rest-1", ingredientId: "bun-1",
      quantity: 50, unit: IngredientUnit.Units, costAtReceipt: 0.5, performedBy: "u1",
    });

    const recipe = Recipe.create({
      id: "r-1", restaurantId: "rest-1", name: "Burger",
      servings: 1,
      ingredients: [
        { ingredientId: "beef-1", ingredientName: "Beef", quantity: 0.2, unit: IngredientUnit.Kg, wastePercent: 0 },
        { ingredientId: "bun-1", ingredientName: "Bun", quantity: 1, unit: IngredientUnit.Units, wastePercent: 0 },
      ],
      estimatedPrepTimeMinutes: 10, isActive: true,
    });

    const stockItems = await stockRepo.findByRestaurant("rest-1");
    const stock = new Map<string, number>();
    for (const item of stockItems) {
      stock.set(item.ingredientId, (stock.get(item.ingredientId) ?? 0) + item.quantity);
    }

    const engine = inventory.getRecipeEngine();
    expect(engine.canFulfill(recipe, 10, stock)).toBe(true);
    expect(engine.canFulfill(recipe, 5, stock)).toBe(true);
    expect(engine.canFulfill(recipe, 1, stock)).toBe(true);
  });
});
