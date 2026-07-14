import type { Gauge as GaugeInterface, MetricLabels } from "../types.js";

export class GaugeMetric implements GaugeInterface {
  private value = 0;
  private readonly labelNames: string[];

  constructor(
    private readonly name: string,
    private readonly help: string,
    labelNames: string[] = [],
  ) {
    this.labelNames = labelNames;
  }

  set(value: number, _labels?: MetricLabels): void {
    this.value = value;
  }

  inc(value = 1, _labels?: MetricLabels): void {
    this.value += value;
  }

  dec(value = 1, _labels?: MetricLabels): void {
    this.value -= value;
  }

  reset(): void {
    this.value = 0;
  }

  collect(): number {
    return this.value;
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
}
