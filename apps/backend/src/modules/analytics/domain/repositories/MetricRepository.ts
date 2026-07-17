import type { BusinessMetric } from "../models/BusinessMetric.js";
import type { MetricRecord } from "../models/MetricRecord.js";
import type { MetricPeriod } from "../models/BusinessMetric.js";

export interface MetricRepository {
  save(metric: BusinessMetric): Promise<void>;
  saveRecord(record: MetricRecord): Promise<void>;
  findById(id: string): Promise<BusinessMetric | null>;
  findByRestaurant(restaurantId: string): Promise<BusinessMetric[]>;
  findRecordsByRestaurant(
    restaurantId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<MetricRecord[]>;
  findRecordsByMetricName(
    restaurantId: string,
    metricName: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<MetricRecord[]>;
  findByCategory(restaurantId: string, category: string): Promise<BusinessMetric[]>;
  findByPeriod(restaurantId: string, period: MetricPeriod): Promise<BusinessMetric[]>;
  delete(id: string): Promise<void>;
}
