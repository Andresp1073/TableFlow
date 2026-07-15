export interface RevenueMetricConfig {
  id: string;
  restaurantId: string;
  date: string;
  timeSlot: string;
  totalCovers: number;
  totalRevenue: number;
  averageCheck: number;
  revenuePerAvailableCover: number;
  tableTurns: number;
  occupancyRate: number;
  averageDiningDurationMinutes: number;
  partySizeDistribution: Record<string, number>;
  cancellationRate: number;
  noShowRate: number;
  recordedAt: Date;
}

export class RevenueMetric {
  private constructor(public readonly data: RevenueMetricConfig) {}

  static create(config: Omit<RevenueMetricConfig, "recordedAt">): RevenueMetric {
    return new RevenueMetric({ ...config, recordedAt: new Date() });
  }

  static reconstitute(config: RevenueMetricConfig): RevenueMetric {
    return new RevenueMetric(config);
  }

  get id(): string { return this.data.id; }
  get restaurantId(): string { return this.data.restaurantId; }
  get date(): string { return this.data.date; }
  get timeSlot(): string { return this.data.timeSlot; }
  get totalCovers(): number { return this.data.totalCovers; }
  get totalRevenue(): number { return this.data.totalRevenue; }
  get averageCheck(): number { return this.data.averageCheck; }
  get revenuePerAvailableCover(): number { return this.data.revenuePerAvailableCover; }
  get tableTurns(): number { return this.data.tableTurns; }
  get occupancyRate(): number { return this.data.occupancyRate; }
  get averageDiningDurationMinutes(): number { return this.data.averageDiningDurationMinutes; }
  get partySizeDistribution(): Record<string, number> { return this.data.partySizeDistribution; }
  get cancellationRate(): number { return this.data.cancellationRate; }
  get noShowRate(): number { return this.data.noShowRate; }
  get recordedAt(): Date { return this.data.recordedAt; }

  equals(other: RevenueMetric): boolean { return this.data.id === other.data.id; }

  revenuePerHour(): number {
    return this.data.averageDiningDurationMinutes > 0
      ? (this.data.totalRevenue / this.data.averageDiningDurationMinutes) * 60
      : 0;
  }

  coversPerTableTurn(): number {
    return this.data.tableTurns > 0 ? this.data.totalCovers / this.data.tableTurns : 0;
  }

  wasProfitable(): boolean {
    return this.data.revenuePerAvailableCover > 0;
  }
}
