import type {
  MetricsCollector,
  Counter as CounterInterface,
  Gauge as GaugeInterface,
  Histogram as HistogramInterface,
  Timer as TimerInterface,
  MetricsSnapshot,
  MetricLabelNames,
} from "../types.js";
import { CounterMetric } from "./Counter.js";
import { GaugeMetric } from "./Gauge.js";
import { HistogramMetric } from "./Histogram.js";
import { TimerMetric } from "./Timer.js";

export class NoopMetricsCollector implements MetricsCollector {
  private counters = new Map<string, CounterInterface>();
  private gauges = new Map<string, GaugeInterface>();
  private histograms = new Map<string, HistogramInterface>();
  private timers = new Map<string, TimerInterface>();

  createCounter(name: string, help: string, labelNames?: MetricLabelNames): CounterInterface {
    const counter = new CounterMetric(name, help, labelNames);

    this.counters.set(name, counter);

    return counter;
  }

  createGauge(name: string, help: string, labelNames?: MetricLabelNames): GaugeInterface {
    const gauge = new GaugeMetric(name, help, labelNames);

    this.gauges.set(name, gauge);

    return gauge;
  }

  createHistogram(name: string, help: string, labelNames?: MetricLabelNames): HistogramInterface {
    const histogram = new HistogramMetric(name, help, undefined, labelNames);

    this.histograms.set(name, histogram);

    return histogram;
  }

  createTimer(name: string, help: string, labelNames?: MetricLabelNames): TimerInterface {
    const timer = new TimerMetric(name, help, labelNames);

    this.timers.set(name, timer);

    return timer;
  }

  getMetrics(): MetricsSnapshot {
    const counters = new Map<string, number>();

    for (const [name, c] of this.counters) {
      counters.set(name, c.collect());
    }

    const gauges = new Map<string, number>();

    for (const [name, g] of this.gauges) {
      gauges.set(name, g.collect());
    }

    const histograms = new Map<string, import("../types.js").HistogramData>();

    for (const [name, h] of this.histograms) {
      histograms.set(name, h.collect());
    }

    const timers = new Map<string, number[]>();

    for (const [name, t] of this.timers) {
      timers.set(name, t.collect());
    }

    return { counters, gauges, histograms, timers };
  }

  clear(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.timers.clear();
  }
}
