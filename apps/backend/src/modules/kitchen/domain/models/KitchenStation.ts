export enum StationType {
  Grill = "grill",
  Bar = "bar",
  Dessert = "dessert",
  Cold = "cold",
  Preparation = "preparation",
  Custom = "custom",
}

export const STATION_TYPES: readonly StationType[] = Object.values(StationType);

export enum StationStatus {
  Active = "active",
  Inactive = "inactive",
  Paused = "paused",
  Closed = "closed",
}

export interface KitchenStationConfig {
  id: string;
  kitchenId: string;
  name: string;
  type: StationType;
  status: StationStatus;
  displayOrder: number;
  maxConcurrentTickets: number;
  currentTickets: number;
  assignedStaff: string[];
  customTypeLabel?: string;
  metadata?: Record<string, string>;
}

export class KitchenStation {
  private constructor(public readonly value: KitchenStationConfig) {}

  static create(config: KitchenStationConfig): KitchenStation {
    if (!config.id.trim()) {
      throw new Error("Station ID cannot be empty");
    }
    if (!config.kitchenId.trim()) {
      throw new Error("Kitchen ID cannot be empty");
    }
    if (!config.name.trim()) {
      throw new Error("Station name cannot be empty");
    }
    if (config.maxConcurrentTickets < 1) {
      throw new Error("Max concurrent tickets must be at least 1");
    }
    if (config.type === StationType.Custom && !config.customTypeLabel) {
      throw new Error("Custom station type requires a label");
    }
    return new KitchenStation({ ...config });
  }

  static reconstitute(config: KitchenStationConfig): KitchenStation {
    return new KitchenStation(config);
  }

  equals(other: KitchenStation): boolean {
    return this.value.id === other.value.id;
  }

  get id(): string {
    return this.value.id;
  }

  get kitchenId(): string {
    return this.value.kitchenId;
  }

  get name(): string {
    return this.value.name;
  }

  get type(): StationType {
    return this.value.type;
  }

  get status(): StationStatus {
    return this.value.status;
  }

  get displayOrder(): number {
    return this.value.displayOrder;
  }

  get maxConcurrentTickets(): number {
    return this.value.maxConcurrentTickets;
  }

  get currentTickets(): number {
    return this.value.currentTickets;
  }

  get assignedStaff(): readonly string[] {
    return this.value.assignedStaff;
  }

  get customTypeLabel(): string | undefined {
    return this.value.customTypeLabel;
  }

  get metadata(): Record<string, string> | undefined {
    return this.value.metadata;
  }

  isAvailable(): boolean {
    return this.value.status === StationStatus.Active
      && this.value.currentTickets < this.value.maxConcurrentTickets;
  }

  canAcceptMoreTickets(): boolean {
    return this.value.currentTickets < this.value.maxConcurrentTickets;
  }

  incrementTickets(): KitchenStation {
    return KitchenStation.reconstitute({
      ...this.value,
      currentTickets: this.value.currentTickets + 1,
    });
  }

  decrementTickets(): KitchenStation {
    return KitchenStation.reconstitute({
      ...this.value,
      currentTickets: Math.max(0, this.value.currentTickets - 1),
    });
  }

  activate(): KitchenStation {
    return KitchenStation.reconstitute({ ...this.value, status: StationStatus.Active });
  }

  pause(): KitchenStation {
    return KitchenStation.reconstitute({ ...this.value, status: StationStatus.Paused });
  }

  close(): KitchenStation {
    return KitchenStation.reconstitute({ ...this.value, status: StationStatus.Closed });
  }

  assignStaff(staffIds: string[]): KitchenStation {
    return KitchenStation.reconstitute({ ...this.value, assignedStaff: [...staffIds] });
  }
}
