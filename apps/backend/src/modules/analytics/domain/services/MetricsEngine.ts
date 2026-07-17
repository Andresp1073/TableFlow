import { BusinessMetric, type MetricCategory, type MetricUnit, type MetricPeriod } from "../models/BusinessMetric.js";
import { MetricRecord } from "../models/MetricRecord.js";

export interface MetricCalculationParams {
  restaurantId: string;
  periodStart: Date;
  periodEnd: Date;
  dimensions?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface MetricResult {
  name: string;
  category: MetricCategory;
  value: number;
  unit: MetricUnit;
  period: MetricPeriod;
}

export interface MetricStrategy {
  readonly metricName: string;
  readonly category: MetricCategory;
  readonly unit: MetricUnit;
  calculate(params: MetricCalculationParams): Promise<MetricResult>;
}

export class RevenueMetricStrategy implements MetricStrategy {
  readonly metricName = "revenue";
  readonly category: MetricCategory = "financial";
  readonly unit: MetricUnit = "usd";

  async calculate(params: MetricCalculationParams): Promise<MetricResult> {
    return {
      name: this.metricName,
      category: this.category,
      value: 0,
      unit: this.unit,
      period: "daily",
    };
  }
}

export class AverageTicketStrategy implements MetricStrategy {
  readonly metricName = "average_ticket";
  readonly category: MetricCategory = "financial";
  readonly unit: MetricUnit = "usd";

  async calculate(params: MetricCalculationParams): Promise<MetricResult> {
    return {
      name: this.metricName,
      category: this.category,
      value: 0,
      unit: this.unit,
      period: "daily",
    };
  }
}

export class OccupancyRateStrategy implements MetricStrategy {
  readonly metricName = "occupancy_rate";
  readonly category: MetricCategory = "operational";
  readonly unit: MetricUnit = "percentage";

  async calculate(params: MetricCalculationParams): Promise<MetricResult> {
    return {
      name: this.metricName,
      category: this.category,
      value: 0,
      unit: this.unit,
      period: "daily",
    };
  }
}

export class ReservationConversionStrategy implements MetricStrategy {
  readonly metricName = "reservation_conversion";
  readonly category: MetricCategory = "reservation";
  readonly unit: MetricUnit = "percentage";

  async calculate(params: MetricCalculationParams): Promise<MetricResult> {
    return {
      name: this.metricName,
      category: this.category,
      value: 0,
      unit: this.unit,
      period: "daily",
    };
  }
}

export class NoShowRateStrategy implements MetricStrategy {
  readonly metricName = "no_show_rate";
  readonly category: MetricCategory = "reservation";
  readonly unit: MetricUnit = "percentage";

  async calculate(params: MetricCalculationParams): Promise<MetricResult> {
    return {
      name: this.metricName,
      category: this.category,
      value: 0,
      unit: this.unit,
      period: "daily",
    };
  }
}

export class CustomerRetentionStrategy implements MetricStrategy {
  readonly metricName = "customer_retention";
  readonly category: MetricCategory = "customer";
  readonly unit: MetricUnit = "percentage";

  async calculate(params: MetricCalculationParams): Promise<MetricResult> {
    return {
      name: this.metricName,
      category: this.category,
      value: 0,
      unit: this.unit,
      period: "monthly",
    };
  }
}

export class InventoryTurnoverStrategy implements MetricStrategy {
  readonly metricName = "inventory_turnover";
  readonly category: MetricCategory = "inventory";
  readonly unit: MetricUnit = "ratio";

  async calculate(params: MetricCalculationParams): Promise<MetricResult> {
    return {
      name: this.metricName,
      category: this.category,
      value: 0,
      unit: this.unit,
      period: "monthly",
    };
  }
}

export class KitchenPrepTimeStrategy implements MetricStrategy {
  readonly metricName = "kitchen_prep_time";
  readonly category: MetricCategory = "kitchen";
  readonly unit: MetricUnit = "minutes";

  async calculate(params: MetricCalculationParams): Promise<MetricResult> {
    return {
      name: this.metricName,
      category: this.category,
      value: 0,
      unit: this.unit,
      period: "hourly",
    };
  }
}

export type MetricProvider = (params: MetricCalculationParams) => Promise<MetricResult>;

export class MetricsEngine {
  private readonly strategies: Map<string, MetricStrategy> = new Map();
  private readonly providers: Map<string, MetricProvider> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    const defaults: MetricStrategy[] = [
      new RevenueMetricStrategy(),
      new AverageTicketStrategy(),
      new OccupancyRateStrategy(),
      new ReservationConversionStrategy(),
      new NoShowRateStrategy(),
      new CustomerRetentionStrategy(),
      new InventoryTurnoverStrategy(),
      new KitchenPrepTimeStrategy(),
    ];
    for (const strategy of defaults) {
      this.registerStrategy(strategy);
    }
  }

  registerStrategy(strategy: MetricStrategy): void {
    this.strategies.set(strategy.metricName, strategy);
  }

  registerProvider(metricName: string, provider: MetricProvider): void {
    this.providers.set(metricName, provider);
  }

  unregisterStrategy(metricName: string): void {
    this.strategies.delete(metricName);
    this.providers.delete(metricName);
  }

  hasStrategy(metricName: string): boolean {
    return this.strategies.has(metricName);
  }

  listRegisteredMetrics(): string[] {
    return Array.from(this.strategies.keys());
  }

  async calculateMetric(params: MetricCalculationParams & { metricName: string }): Promise<BusinessMetric> {
    const strategy = this.strategies.get(params.metricName);
    const provider = this.providers.get(params.metricName);

    let result: MetricResult;

    if (provider) {
      result = await provider(params);
    } else if (strategy) {
      result = await strategy.calculate(params);
    } else {
      throw new Error(`No strategy or provider registered for metric: ${params.metricName}`);
    }

    return BusinessMetric.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      name: result.name,
      category: result.category,
      value: result.value,
      unit: result.unit,
      period: result.period,
      dimensions: params.dimensions ?? {},
      metadata: params.metadata,
    });
  }

  async calculateMetrics(params: MetricCalculationParams, metricNames?: string[]): Promise<BusinessMetric[]> {
    const names = metricNames ?? Array.from(this.strategies.keys());
    const results = await Promise.all(
      names.map((name) =>
        this.calculateMetric({ ...params, metricName: name }).catch(() => null),
      ),
    );
    return results.filter((r): r is BusinessMetric => r !== null);
  }

  createRecord(metric: BusinessMetric, periodStart: Date, periodEnd: Date): MetricRecord {
    return MetricRecord.create({
      id: crypto.randomUUID(),
      restaurantId: metric.restaurantId,
      metricName: metric.name,
      category: metric.category,
      value: metric.value,
      unit: metric.unit,
      period: metric.period,
      periodStart,
      periodEnd,
      dimensions: metric.dimensions,
    });
  }
}
