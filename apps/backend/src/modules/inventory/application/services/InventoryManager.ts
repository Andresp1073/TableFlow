import type { StockItemRepository } from "../../domain/repositories/StockItemRepository.js";
import type { IngredientRepository } from "../../domain/repositories/IngredientRepository.js";
import { StockItem } from "../../domain/models/StockItem.js";
import { StockMovement, StockMovementType } from "../../domain/models/StockMovement.js";
import type { IngredientUnit } from "../../domain/models/Ingredient.js";
import { StockCalculator } from "../../domain/services/StockCalculator.js";
import { RecipeEngine } from "../../domain/services/RecipeEngine.js";
import { ExpirationService } from "../../domain/services/ExpirationService.js";

export class InventoryManager {
  private readonly stockCalculator: StockCalculator;
  private readonly recipeEngine: RecipeEngine;
  private readonly expirationService: ExpirationService;
  private readonly movements: StockMovement[] = [];

  constructor(
    private readonly stockItemRepository: StockItemRepository,
    private readonly ingredientRepository: IngredientRepository,
  ) {
    this.stockCalculator = new StockCalculator();
    this.recipeEngine = new RecipeEngine();
    this.expirationService = new ExpirationService();
  }

  async addStock(config: {
    restaurantId: string;
    ingredientId: string;
    quantity: number;
    unit: IngredientUnit;
    costAtReceipt: number;
    batchCode?: string;
    location?: string;
    expiresAt?: Date;
    performedBy: string;
    referenceId?: string;
  }): Promise<{ stockItem: StockItem; movement: StockMovement }> {
    const item = StockItem.create({
      id: crypto.randomUUID(),
      restaurantId: config.restaurantId,
      ingredientId: config.ingredientId,
      quantity: config.quantity,
      unit: config.unit,
      location: config.location,
      batchCode: config.batchCode,
      receivedAt: new Date(),
      expiresAt: config.expiresAt ?? null,
      costAtReceipt: config.costAtReceipt,
      isActive: true,
    });

    await this.stockItemRepository.save(item);

    const movement = StockMovement.create({
      id: crypto.randomUUID(),
      restaurantId: config.restaurantId,
      ingredientId: config.ingredientId,
      stockItemId: item.id,
      type: StockMovementType.Purchase,
      quantity: config.quantity,
      unit: config.unit,
      unitCost: config.costAtReceipt,
      referenceId: config.referenceId,
      performedBy: config.performedBy,
    });

    this.movements.push(movement);
    return { stockItem: item, movement };
  }

  async consumeStock(config: {
    restaurantId: string;
    ingredientId: string;
    quantity: number;
    unit: IngredientUnit;
    performedBy: string;
    reason?: string;
  }): Promise<StockMovement> {
    const items = await this.stockItemRepository.findByIngredient(config.ingredientId);
    let remaining = config.quantity;

    const sorted = this.expirationService.suggestUsageOrder(items);

    for (const item of sorted) {
      if (remaining <= 0) break;
      const toDeduct = Math.min(remaining, item.quantity);
      const updated = item.decreaseStock(toDeduct);
      await this.stockItemRepository.save(updated);
      remaining -= toDeduct;
    }

    if (remaining > 0) {
      throw new Error(`Insufficient stock for ingredient: ${config.ingredientId}`);
    }

    const movement = StockMovement.create({
      id: crypto.randomUUID(),
      restaurantId: config.restaurantId,
      ingredientId: config.ingredientId,
      stockItemId: "",
      type: StockMovementType.Consumption,
      quantity: config.quantity,
      unit: config.unit,
      unitCost: 0,
      reason: config.reason,
      performedBy: config.performedBy,
    });

    this.movements.push(movement);
    return movement;
  }

  async adjustStock(config: {
    restaurantId: string;
    stockItemId: string;
    newQuantity: number;
    performedBy: string;
    reason: string;
  }): Promise<StockItem> {
    const item = await this.stockItemRepository.findById(config.stockItemId);
    if (!item) throw new Error(`Stock item not found: ${config.stockItemId}`);

    const previousQuantity = item.quantity;
    const updated = item.adjustStock(config.newQuantity);
    await this.stockItemRepository.save(updated);

    const movement = StockMovement.create({
      id: crypto.randomUUID(),
      restaurantId: config.restaurantId,
      ingredientId: item.ingredientId,
      stockItemId: item.id,
      type: StockMovementType.Adjustment,
      quantity: config.newQuantity - previousQuantity,
      unit: item.unit,
      unitCost: item.costAtReceipt,
      reason: config.reason,
      performedBy: config.performedBy,
    });

    this.movements.push(movement);
    return updated;
  }

  async recordWaste(config: {
    restaurantId: string;
    ingredientId: string;
    quantity: number;
    unit: IngredientUnit;
    reason: string;
    performedBy: string;
  }): Promise<StockMovement> {
    const items = await this.stockItemRepository.findByIngredient(config.ingredientId);
    let remaining = config.quantity;

    for (const item of items) {
      if (remaining <= 0) break;
      const toDeduct = Math.min(remaining, item.quantity);
      const updated = item.decreaseStock(toDeduct);
      await this.stockItemRepository.save(updated);
      remaining -= toDeduct;
    }

    const movement = StockMovement.create({
      id: crypto.randomUUID(),
      restaurantId: config.restaurantId,
      ingredientId: config.ingredientId,
      stockItemId: "",
      type: StockMovementType.Waste,
      quantity: config.quantity,
      unit: config.unit,
      unitCost: 0,
      reason: config.reason,
      performedBy: config.performedBy,
    });

    this.movements.push(movement);
    return movement;
  }

  async transferStock(config: {
    restaurantId: string;
    ingredientId: string;
    quantity: number;
    unit: IngredientUnit;
    fromLocation: string;
    toLocation: string;
    performedBy: string;
  }): Promise<StockMovement> {
    const movement = StockMovement.create({
      id: crypto.randomUUID(),
      restaurantId: config.restaurantId,
      ingredientId: config.ingredientId,
      stockItemId: "",
      type: StockMovementType.Transfer,
      quantity: config.quantity,
      unit: config.unit,
      unitCost: 0,
      reason: `Transfer from ${config.fromLocation} to ${config.toLocation}`,
      performedBy: config.performedBy,
    });

    this.movements.push(movement);
    return movement;
  }

  async getStockSummary(restaurantId: string) {
    const items = await this.stockItemRepository.findByRestaurant(restaurantId);
    return this.stockCalculator.summarizeStock(items);
  }

  async checkExpirations(restaurantId: string) {
    const items = await this.stockItemRepository.findByRestaurant(restaurantId);
    return this.expirationService.checkExpiration(items);
  }

  getRecipeEngine(): RecipeEngine { return this.recipeEngine; }
  getExpirationService(): ExpirationService { return this.expirationService; }
  getStockCalculator(): StockCalculator { return this.stockCalculator; }
}
