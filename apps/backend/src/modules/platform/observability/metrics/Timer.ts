import type { Timer as TimerInterface, MetricLabels } from "../types.js";

export class TimerMetric implements TimerInterface {
  private values: number[] = [];
  private readonly labelNames: string[];

  constructor(
    private readonly name: string,
    private readonly help: string,
    labelNames: string[] = [],
  ) {
    this.labelNames = labelNames;
  }

  start(): () => number {
    const startTime = performance.now();

    return (): number => {
      const duration = performance.now() - startTime;

      this.values.push(duration);

      return duration;
    };
  }

  async measure<T>(fn: () => Promise<T>): Promise<T> {
    const end = this.start();

    try {
      const result = await fn();

      end();

      return result;
    } catch (error) {
      end();
      throw error;
    }
  }

  observe(duration: number, _labels?: MetricLabels): void {
    this.values.push(duration);
  }

  reset(): void {
    this.values = [];
  }

  collect(): number[] {
    return [...this.values];
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
