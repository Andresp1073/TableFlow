import type { Histogram as HistogramInterface, HistogramData, HistogramBucket, MetricLabels } from "../types.js";

const DEFAULT_BUCKETS: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

export class HistogramMetric implements HistogramInterface {
  private values: number[] = [];
  private readonly buckets: number[];
  private readonly labelNames: string[];

  constructor(
    private readonly name: string,
    private readonly help: string,
    buckets?: number[],
    labelNames: string[] = [],
  ) {
    this.buckets = buckets ?? DEFAULT_BUCKETS;
    this.labelNames = labelNames;
  }

  observe(value: number, _labels?: MetricLabels): void {
    this.values.push(value);
  }

  reset(): void {
    this.values = [];
  }

  collect(): HistogramData {
    const sorted = [...this.values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((acc, v) => acc + v, 0);

    const buckets: HistogramBucket[] = this.buckets.map((upperBound) => {
      const cumulativeCount = sorted.filter((v) => v <= upperBound).length;

      return { upperBound, cumulativeCount };
    });

    return { count, sum, buckets };
  }

  getName(): string {
    return this.name;
  }

  getHelp(): string {
    return this.help;
  }

  getLabelNames(): string[] {
    return this.labelNames;
  }

  getBuckets(): number[] {
    return [...this.buckets];
  }
}
