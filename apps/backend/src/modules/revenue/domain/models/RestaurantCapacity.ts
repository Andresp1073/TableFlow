export type TimeSlot = "breakfast" | "lunch" | "dinner" | "late_night";

export interface DiningAreaConfig {
  id: string;
  name: string;
  capacity: number;
  tableCount: number;
  averageDiningDurationMinutes: number;
  isActive: boolean;
}

export interface RestaurantCapacityConfig {
  id: string;
  restaurantId: string;
  diningAreas: DiningAreaConfig[];
  totalCapacity: number;
  maxCoversPerTimeSlot: Record<TimeSlot, number>;
  timeSlotDurations: Record<TimeSlot, number>;
  minPartySize: number;
  maxPartySize: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class RestaurantCapacity {
  private constructor(public readonly data: RestaurantCapacityConfig) {}

  static create(config: Omit<RestaurantCapacityConfig, "isActive" | "createdAt" | "updatedAt">): RestaurantCapacity {
    const now = new Date();
    return new RestaurantCapacity({ ...config, isActive: true, createdAt: now, updatedAt: now });
  }

  static reconstitute(config: RestaurantCapacityConfig): RestaurantCapacity {
    return new RestaurantCapacity(config);
  }

  get id(): string { return this.data.id; }
  get restaurantId(): string { return this.data.restaurantId; }
  get diningAreas(): readonly DiningAreaConfig[] { return this.data.diningAreas; }
  get totalCapacity(): number { return this.data.totalCapacity; }
  get maxCoversPerTimeSlot(): Record<TimeSlot, number> { return this.data.maxCoversPerTimeSlot; }
  get timeSlotDurations(): Record<TimeSlot, number> { return this.data.timeSlotDurations; }
  get minPartySize(): number { return this.data.minPartySize; }
  get maxPartySize(): number { return this.data.maxPartySize; }
  get isActive(): boolean { return this.data.isActive; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  equals(other: RestaurantCapacity): boolean { return this.data.id === other.data.id; }

  getTotalCapacityForTimeSlot(slot: TimeSlot): number {
    return this.data.maxCoversPerTimeSlot[slot] ?? this.data.totalCapacity;
  }

  calculateMaxTurns(slot: TimeSlot, operatingMinutes: number): number {
    const duration = this.data.timeSlotDurations[slot] ?? 60;
    return Math.floor(operatingMinutes / duration);
  }

  getActiveDiningAreas(): DiningAreaConfig[] {
    return this.data.diningAreas.filter((a) => a.isActive);
  }

  updateAreas(areas: DiningAreaConfig[]): RestaurantCapacity {
    return RestaurantCapacity.reconstitute({
      ...this.data, diningAreas: areas, totalCapacity: areas.reduce((s, a) => s + a.capacity, 0), updatedAt: new Date(),
    });
  }

  activate(): RestaurantCapacity {
    return RestaurantCapacity.reconstitute({ ...this.data, isActive: true, updatedAt: new Date() });
  }

  deactivate(): RestaurantCapacity {
    return RestaurantCapacity.reconstitute({ ...this.data, isActive: false, updatedAt: new Date() });
  }
}
