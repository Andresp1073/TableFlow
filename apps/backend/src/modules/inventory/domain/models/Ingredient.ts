export enum IngredientCategory {
  RawMaterial = "raw_material",
  Prepared = "prepared",
  FinishedProduct = "finished_product",
  Consumable = "consumable",
  Packaging = "packaging",
}

export enum IngredientUnit {
  Kg = "kg",
  G = "g",
  L = "l",
  Ml = "ml",
  Units = "units",
  Pieces = "pieces",
  Boxes = "boxes",
  Cases = "cases",
  Bags = "bags",
}

export interface IngredientConfig {
  id: string;
  restaurantId: string;
  name: string;
  category: IngredientCategory;
  unit: IngredientUnit;
  costPerUnit: number;
  preferredSupplierId?: string;
  sku?: string;
  perishable: boolean;
  shelfLifeDays?: number;
  storageInstructions?: string;
  isActive: boolean;
}

export class Ingredient {
  private constructor(public readonly value: IngredientConfig) {}

  static create(config: IngredientConfig): Ingredient {
    if (!config.id.trim()) throw new Error("Ingredient ID cannot be empty");
    if (!config.name.trim()) throw new Error("Ingredient name cannot be empty");
    if (config.costPerUnit < 0) throw new Error("Cost per unit cannot be negative");
    return new Ingredient({ ...config });
  }

  static reconstitute(config: IngredientConfig): Ingredient {
    return new Ingredient(config);
  }

  get id(): string { return this.value.id; }
  get restaurantId(): string { return this.value.restaurantId; }
  get name(): string { return this.value.name; }
  get category(): IngredientCategory { return this.value.category; }
  get unit(): IngredientUnit { return this.value.unit; }
  get costPerUnit(): number { return this.value.costPerUnit; }
  get preferredSupplierId(): string | undefined { return this.value.preferredSupplierId; }
  get sku(): string | undefined { return this.value.sku; }
  get perishable(): boolean { return this.value.perishable; }
  get shelfLifeDays(): number | undefined { return this.value.shelfLifeDays; }
  get storageInstructions(): string | undefined { return this.value.storageInstructions; }
  get isActive(): boolean { return this.value.isActive; }

  equals(other: Ingredient): boolean { return this.value.id === other.value.id; }

  updateCost(costPerUnit: number): Ingredient {
    return Ingredient.reconstitute({ ...this.value, costPerUnit });
  }

  deactivate(): Ingredient {
    return Ingredient.reconstitute({ ...this.value, isActive: false });
  }

  activate(): Ingredient {
    return Ingredient.reconstitute({ ...this.value, isActive: true });
  }
}
