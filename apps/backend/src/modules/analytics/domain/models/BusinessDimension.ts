export interface BusinessDimensionConfig {
  id: string;
  name: string;
  type: DimensionType;
  hierarchyLevel: number;
  displayName: string;
  description?: string;
}

export type DimensionType =
  | "restaurant"
  | "dining_area"
  | "table"
  | "reservation"
  | "customer"
  | "payment"
  | "order"
  | "inventory"
  | "time"
  | "employee"
  | "menu_item"
  | "promotion"
  | "channel";

export class BusinessDimension {
  private constructor(public readonly data: BusinessDimensionConfig) {}

  static create(config: BusinessDimensionConfig): BusinessDimension {
    return new BusinessDimension(config);
  }

  static reconstitute(config: BusinessDimensionConfig): BusinessDimension {
    return new BusinessDimension(config);
  }

  get id(): string { return this.data.id; }
  get name(): string { return this.data.name; }
  get type(): DimensionType { return this.data.type; }
  get hierarchyLevel(): number { return this.data.hierarchyLevel; }
  get displayName(): string { return this.data.displayName; }
  get description(): string | undefined { return this.data.description; }

  equals(other: BusinessDimension): boolean {
    return this.data.id === other.data.id;
  }
}
