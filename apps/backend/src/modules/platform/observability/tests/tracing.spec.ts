import { describe, it, expect, vi } from "vitest";
import { Span } from "../tracing/Span.js";
import { DefaultTracer } from "../tracing/Tracer.js";
import { NoopTracer } from "../tracing/NoopTracer.js";
import { createSpanContext, isSpanContextValid } from "../tracing/SpanContext.js";
import { SpanStatusCode } from "../types.js";
import type { SpanContext, Span as SpanInterface } from "../types.js";

describe("createSpanContext", () => {
  it("creates a valid span context with traceId and spanId", () => {
    const ctx = createSpanContext();

    expect(ctx.traceId).toBeDefined();
    expect(ctx.traceId.length).toBeGreaterThan(0);
    expect(ctx.spanId).toBeDefined();
    expect(ctx.spanId.length).toBeGreaterThan(0);
  });

  it("creates a child context with parent relationship", () => {
    const parent = createSpanContext();
    const child = createSpanContext(parent);

    expect(child.traceId).toBe(parent.traceId);
    expect(child.parentSpanId).toBe(parent.spanId);
    expect(child.spanId).not.toBe(parent.spanId);
  });

  it("sets isRemote to false for new contexts", () => {
    const ctx = createSpanContext();

    expect(ctx.isRemote).toBe(false);
  });

  it("sets traceFlags to 1 by default", () => {
    const ctx = createSpanContext();

    expect(ctx.traceFlags).toBe(1);
  });
});

describe("isSpanContextValid", () => {
  it("returns true for a valid context", () => {
    const ctx = createSpanContext();

    expect(isSpanContextValid(ctx)).toBe(true);
  });

  it("returns false for empty traceId", () => {
    const ctx: SpanContext = { traceId: "", spanId: "abc" };

    expect(isSpanContextValid(ctx)).toBe(false);
  });

  it("returns false for empty spanId", () => {
    const ctx: SpanContext = { traceId: "abc", spanId: "" };

    expect(isSpanContextValid(ctx)).toBe(false);
  });
});

describe("Span", () => {
  it("is recording when created", () => {
    const ctx = createSpanContext();
    const span = new Span(ctx, "test-span");

    expect(span.isRecording()).toBe(true);
  });

  it("stops recording when ended", () => {
    const ctx = createSpanContext();
    const span = new Span(ctx, "test-span");

    span.end();
    expect(span.isRecording()).toBe(false);
  });

  it("sets attributes", () => {
    const ctx = createSpanContext();
    const span = new Span(ctx, "test-span");

    span.setAttribute("key1", "value1");
    span.setAttribute("key2", 42);

    const attrs = span.getAttributes();

    expect(attrs.key1).toBe("value1");
    expect(attrs.key2).toBe(42);
  });

  it("sets multiple attributes at once", () => {
    const ctx = createSpanContext();
    const span = new Span(ctx, "test-span");

    span.setAttributes({ a: 1, b: "two", c: true });

    const attrs = span.getAttributes();

    expect(attrs.a).toBe(1);
    expect(attrs.b).toBe("two");
    expect(attrs.c).toBe(true);
  });

  it("adds events", () => {
    const ctx = createSpanContext();
    const span = new Span(ctx, "test-span");

    span.addEvent("event1", { data: "test" });

    const events = span.getEvents();

    expect(events).toHaveLength(1);
    expect(events[0]?.name).toBe("event1");
    expect(events[0]?.attributes).toEqual({ data: "test" });
  });

  it("sets status", () => {
    const ctx = createSpanContext();
    const span = new Span(ctx, "test-span");

    span.setStatus({ code: SpanStatusCode.OK });

    expect(span.getStatus().code).toBe(SpanStatusCode.OK);
  });

  it("records an error", () => {
    const ctx = createSpanContext();
    const span = new Span(ctx, "test-span");
    const error = new Error("something broke");

    span.recordError(error);

    const status = span.getStatus();

    expect(status.code).toBe(SpanStatusCode.ERROR);
    expect(status.message).toBe("something broke");

    const attrs = span.getAttributes();

    expect(attrs["error.type"]).toBe("Error");
    expect(attrs["error.message"]).toBe("something broke");
    expect(attrs["error.stack"]).toBeDefined();
  });

  it("exposes spanContext", () => {
    const ctx = createSpanContext();
    const span = new Span(ctx, "test-span");

    expect(span.spanContext).toBe(ctx);
  });
});

describe("DefaultTracer", () => {
  it("starts a span", () => {
    const tracer = new DefaultTracer();
    const span = tracer.startSpan("test-op");

    expect(span.spanContext.traceId).toBeDefined();
    expect(span.spanContext.spanId).toBeDefined();
  });

  it("starts a span with parent context", () => {
    const tracer = new DefaultTracer();
    const parent = tracer.startSpan("parent");
    const child = tracer.startSpan("child", { parentContext: parent.spanContext });

    expect(child.spanContext.traceId).toBe(parent.spanContext.traceId);
    expect(child.spanContext.parentSpanId).toBe(parent.spanContext.spanId);
  });

  it("starts a span with attributes", () => {
    const tracer = new DefaultTracer();
    const span = tracer.startSpan("attr-span", { attributes: { env: "test" } });

    expect(span.getAttributes().env).toBe("test");
  });

  it("startActiveSpan creates and ends a span", () => {
    const tracer = new DefaultTracer();
    const fn = vi.fn();

    tracer.startActiveSpan("active", (span) => {
      fn(span.spanContext.spanId);
    });

    expect(fn).toHaveBeenCalledOnce();
  });

  it("startActiveSpan handles errors", () => {
    const tracer = new DefaultTracer();

    expect(() => {
      tracer.startActiveSpan("failing", () => {
        throw new Error("oops");
      });
    }).toThrow("oops");
  });

  it("withSpan creates a child span", () => {
    const tracer = new DefaultTracer();
    const parent = tracer.startSpan("parent");
    const fn = vi.fn();

    tracer.withSpan(parent.spanContext, "child", (span) => {
      fn(span.spanContext.parentSpanId);
    });

    expect(fn).toHaveBeenCalledWith(parent.spanContext.spanId);
  });

  it("injects span context into carrier", () => {
    const tracer = new DefaultTracer();
    const ctx = createSpanContext();
    const carrier: Record<string, unknown> = {};

    tracer.inject(ctx, carrier);

    expect(carrier["traceparent"]).toBeDefined();
    expect(carrier["tracestate"]).toBeDefined();
  });

  it("extracts span context from carrier", () => {
    const tracer = new DefaultTracer();
    const carrier: Record<string, unknown> = {
      traceparent: "00-abc123def456-span789-01",
      tracestate: "",
    };

    const ctx = tracer.extract(carrier);

    expect(ctx).not.toBeNull();
    expect(ctx?.traceId).toBe("abc123def456");
    expect(ctx?.spanId).toBe("span789");
  });

  it("returns null for invalid carrier", () => {
    const tracer = new DefaultTracer();

    const ctx = tracer.extract({});

    expect(ctx).toBeNull();
  });
});

describe("NoopTracer", () => {
  it("starts a noop span", () => {
    const tracer = new NoopTracer();
    const span = tracer.startSpan("test");

    expect(span.spanContext.traceId).toBeDefined();
  });

  it("startActiveSpan invokes the callback", () => {
    const tracer = new NoopTracer();
    const fn = vi.fn();

    tracer.startActiveSpan("test", (span) => {
      fn(span);
    });

    expect(fn).toHaveBeenCalledOnce();
  });

  it("withSpan invokes the callback", () => {
    const tracer = new NoopTracer();
    const fn = vi.fn();
    const ctx = createSpanContext();

    tracer.withSpan(ctx, "test", (span) => {
      fn(span);
    });

    expect(fn).toHaveBeenCalledOnce();
  });

  it("inject does nothing", () => {
    const tracer = new NoopTracer();
    const ctx = createSpanContext();
    const carrier: Record<string, unknown> = {};

    tracer.inject(ctx, carrier);

    expect(Object.keys(carrier)).toHaveLength(0);
  });

  it("extract returns a dummy context", () => {
    const tracer = new NoopTracer();
    const ctx = tracer.extract({});

    expect(ctx).not.toBeNull();
    expect(ctx?.traceId).toBeDefined();
  });
});
