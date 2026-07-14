import { describe, it, expect, vi } from "vitest";
import { CounterMetric } from "../metrics/Counter.js";
import { GaugeMetric } from "../metrics/Gauge.js";
import { HistogramMetric } from "../metrics/Histogram.js";
import { TimerMetric } from "../metrics/Timer.js";
import { NoopMetricsCollector } from "../metrics/NoopMetricsCollector.js";
import type { MetricsSnapshot } from "../types.js";

describe("CounterMetric", () => {
  it("starts at zero", () => {
    const counter = new CounterMetric("test_counter", "Test counter");

    expect(counter.collect()).toBe(0);
  });

  it("increments by 1 by default", () => {
    const counter = new CounterMetric("test_counter", "Test counter");

    counter.inc();
    expect(counter.collect()).toBe(1);
  });

  it("increments by specified value", () => {
    const counter = new CounterMetric("test_counter", "Test counter");

    counter.inc(5);
    expect(counter.collect()).toBe(5);
  });

  it("accumulates multiple calls", () => {
    const counter = new CounterMetric("test_counter", "Test counter");

    counter.inc(2);
    counter.inc(3);
    counter.inc(1);
    expect(counter.collect()).toBe(6);
  });

  it("resets to zero", () => {
    const counter = new CounterMetric("test_counter", "Test counter");

    counter.inc(10);
    counter.reset();
    expect(counter.collect()).toBe(0);
  });

  it("exposes metadata", () => {
    const counter = new CounterMetric("my_counter", "My counter", ["env"]);

    expect(counter.getName()).toBe("my_counter");
    expect(counter.getHelp()).toBe("My counter");
    expect(counter.getLabelNames()).toEqual(["env"]);
  });
});

describe("GaugeMetric", () => {
  it("starts at zero", () => {
    const gauge = new GaugeMetric("test_gauge", "Test gauge");

    expect(gauge.collect()).toBe(0);
  });

  it("sets a value", () => {
    const gauge = new GaugeMetric("test_gauge", "Test gauge");

    gauge.set(42);
    expect(gauge.collect()).toBe(42);
  });

  it("increments", () => {
    const gauge = new GaugeMetric("test_gauge", "Test gauge");

    gauge.set(10);
    gauge.inc(5);
    expect(gauge.collect()).toBe(15);
  });

  it("decrements", () => {
    const gauge = new GaugeMetric("test_gauge", "Test gauge");

    gauge.set(10);
    gauge.dec(3);
    expect(gauge.collect()).toBe(7);
  });

  it("resets to zero", () => {
    const gauge = new GaugeMetric("test_gauge", "Test gauge");

    gauge.set(99);
    gauge.reset();
    expect(gauge.collect()).toBe(0);
  });
});

describe("HistogramMetric", () => {
  it("starts with zero observations", () => {
    const hist = new HistogramMetric("test_hist", "Test histogram");

    const data = hist.collect();

    expect(data.count).toBe(0);
    expect(data.sum).toBe(0);
  });

  it("observes values", () => {
    const hist = new HistogramMetric("test_hist", "Test histogram");

    hist.observe(0.5);
    hist.observe(1.0);
    hist.observe(2.0);

    const data = hist.collect();

    expect(data.count).toBe(3);
    expect(data.sum).toBeCloseTo(3.5);
  });

  it("distributes values into buckets", () => {
    const hist = new HistogramMetric("test_hist", "Test histogram", [1, 5, 10]);

    hist.observe(0.5);
    hist.observe(1.5);
    hist.observe(3.0);
    hist.observe(7.0);
    hist.observe(12.0);

    const data = hist.collect();

    expect(data.buckets[0]?.upperBound).toBe(1);
    expect(data.buckets[0]?.cumulativeCount).toBe(1);
    expect(data.buckets[1]?.upperBound).toBe(5);
    expect(data.buckets[1]?.cumulativeCount).toBe(3);
    expect(data.buckets[2]?.upperBound).toBe(10);
    expect(data.buckets[2]?.cumulativeCount).toBe(4);
  });

  it("resets observations", () => {
    const hist = new HistogramMetric("test_hist", "Test histogram");

    hist.observe(1);
    hist.observe(2);
    hist.reset();

    const data = hist.collect();

    expect(data.count).toBe(0);
    expect(data.sum).toBe(0);
  });
});

describe("TimerMetric", () => {
  it("measures duration via start/end", () => {
    const timer = new TimerMetric("test_timer", "Test timer");
    const end = timer.start();

    const duration = end();

    expect(duration).toBeGreaterThanOrEqual(0);
    expect(timer.collect()).toHaveLength(1);
    expect(timer.collect()[0]).toBe(duration);
  });

  it("observes an explicit duration", () => {
    const timer = new TimerMetric("test_timer", "Test timer");

    timer.observe(100);
    timer.observe(200);

    expect(timer.collect()).toEqual([100, 200]);
  });

  it("resets observations", () => {
    const timer = new TimerMetric("test_timer", "Test timer");

    timer.observe(50);
    timer.reset();

    expect(timer.collect()).toHaveLength(0);
  });

  it("measures async function via measure()", async () => {
    const timer = new TimerMetric("test_timer", "Test timer");

    const result = await timer.measure(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));

      return "done";
    });

    expect(result).toBe("done");
    expect(timer.collect()).toHaveLength(1);
    expect(timer.collect()[0]).toBeGreaterThanOrEqual(0);
  });

  it("records duration even when measured fn throws", async () => {
    const timer = new TimerMetric("test_timer", "Test timer");

    await expect(
      timer.measure(async () => {
        await new Promise((resolve) => setTimeout(resolve, 2));
        throw new Error("fn failed");
      }),
    ).rejects.toThrow("fn failed");

    expect(timer.collect()).toHaveLength(1);
  });
});

describe("NoopMetricsCollector", () => {
  it("creates and collects counter metrics", () => {
    const collector = new NoopMetricsCollector();
    const counter = collector.createCounter("requests_total", "Total requests");

    counter.inc(5);
    expect(counter.collect()).toBe(5);
  });

  it("creates and collects gauge metrics", () => {
    const collector = new NoopMetricsCollector();
    const gauge = collector.createGauge("active_users", "Active users");

    gauge.set(42);
    expect(gauge.collect()).toBe(42);
  });

  it("creates and collects histogram metrics", () => {
    const collector = new NoopMetricsCollector();
    const hist = collector.createHistogram("latency", "Request latency");

    hist.observe(0.5);
    hist.observe(1.5);

    const data = hist.collect();

    expect(data.count).toBe(2);
    expect(data.sum).toBeCloseTo(2.0);
  });

  it("creates and collects timer metrics", () => {
    const collector = new NoopMetricsCollector();
    const timer = collector.createTimer("operation_duration", "Operation duration");

    timer.observe(100);

    expect(timer.collect()).toEqual([100]);
  });

  it("getMetrics returns a snapshot", () => {
    const collector = new NoopMetricsCollector();

    collector.createCounter("c1", "Counter 1").inc(3);
    collector.createGauge("g1", "Gauge 1").set(7);
    collector.createHistogram("h1", "Hist 1").observe(1);
    collector.createTimer("t1", "Timer 1").observe(50);

    const snapshot: MetricsSnapshot = collector.getMetrics();

    expect(snapshot.counters.get("c1")).toBe(3);
    expect(snapshot.gauges.get("g1")).toBe(7);
    expect(snapshot.histograms.get("h1")?.count).toBe(1);
    expect(snapshot.timers.get("t1")).toEqual([50]);
  });

  it("clear removes all metrics", () => {
    const collector = new NoopMetricsCollector();

    collector.createCounter("c1", "Counter 1").inc(1);
    collector.clear();

    const snapshot = collector.getMetrics();

    expect(snapshot.counters.size).toBe(0);
    expect(snapshot.gauges.size).toBe(0);
    expect(snapshot.histograms.size).toBe(0);
    expect(snapshot.timers.size).toBe(0);
  });
});
