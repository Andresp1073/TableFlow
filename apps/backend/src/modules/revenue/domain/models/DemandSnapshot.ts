export interface DemandPoint {
  timeSlot: string;
  date: string;
  reservationCount: number;
  walkInCount: number;
  turnawayCount: number;
  occupancyRate: number;
  averagePartySize: number;
  totalCovers: number;
}

export interface DemandSummary {
  totalReservations: number;
  totalWalkIns: number;
  totalTurnaways: number;
  averageOccupancyRate: number;
  peakSlot: string;
  peakOccupancy: number;
  lowSlot: string;
  lowOccupancy: number;
  averagePartySize: number;
  totalCovers: number;
}

export interface DemandSnapshotConfig {
  id: string;
  restaurantId: string;
  date: string;
  timeSlot: TimeSlot;
  reservationVolume: number;
  walkInVolume: number;
  turnawayCount: number;
  occupancyRate: number;
  totalCapacity: number;
  coversServed: number;
  averagePartySize: number;
  averageDiningDurationMinutes: number;
  revenueGenerated: number;
  isHoliday: boolean;
  specialEvent: string | null;
  weather: string | null;
  notes: string;
  recordedAt: Date;
}

import type { TimeSlot } from "./RestaurantCapacity.js";

export class DemandSnapshot {
  private constructor(public readonly data: DemandSnapshotConfig) {}

  static create(config: Omit<DemandSnapshotConfig, "recordedAt">): DemandSnapshot {
    return new DemandSnapshot({ ...config, recordedAt: new Date() });
  }

  static reconstitute(config: DemandSnapshotConfig): DemandSnapshot {
    return new DemandSnapshot(config);
  }

  get id(): string { return this.data.id; }
  get restaurantId(): string { return this.data.restaurantId; }
  get date(): string { return this.data.date; }
  get timeSlot(): TimeSlot { return this.data.timeSlot; }
  get reservationVolume(): number { return this.data.reservationVolume; }
  get walkInVolume(): number { return this.data.walkInVolume; }
  get turnawayCount(): number { return this.data.turnawayCount; }
  get occupancyRate(): number { return this.data.occupancyRate; }
  get totalCapacity(): number { return this.data.totalCapacity; }
  get coversServed(): number { return this.data.coversServed; }
  get averagePartySize(): number { return this.data.averagePartySize; }
  get averageDiningDurationMinutes(): number { return this.data.averageDiningDurationMinutes; }
  get revenueGenerated(): number { return this.data.revenueGenerated; }
  get isHoliday(): boolean { return this.data.isHoliday; }
  get specialEvent(): string | null { return this.data.specialEvent; }
  get weather(): string | null { return this.data.weather; }
  get notes(): string { return this.data.notes; }
  get recordedAt(): Date { return this.data.recordedAt; }

  equals(other: DemandSnapshot): boolean { return this.data.id === other.data.id; }

  totalDemand(): number { return this.data.reservationVolume + this.data.walkInVolume; }
  unservedDemand(): number { return Math.max(0, this.totalDemand() - this.data.coversServed); }
  lostRevenue(): number { return this.unservedDemand() * (this.data.revenueGenerated / Math.max(1, this.data.coversServed)); }
  utilizationRate(): number { return this.data.totalCapacity > 0 ? this.data.coversServed / this.data.totalCapacity : 0; }
}
