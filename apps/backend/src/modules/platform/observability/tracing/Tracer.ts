import type {
  Tracer as TracerInterface,
  Span as SpanInterface,
  SpanContext as SpanContextInterface,
  StartSpanOptions,
} from "../types.js";
import { Span } from "./Span.js";
import { createSpanContext } from "./SpanContext.js";

export class DefaultTracer implements TracerInterface {
  startSpan(name: string, options?: StartSpanOptions): SpanInterface {
    const parentContext = options?.parentContext;
    const spanContext = createSpanContext(parentContext);

    return new Span(spanContext, name, options?.attributes, options?.startTime);
  }

  startActiveSpan<F extends (...args: unknown[]) => unknown>(
    name: string,
    fn: (span: SpanInterface) => ReturnType<F>,
    options?: StartSpanOptions,
  ): ReturnType<F> {
    const span = this.startSpan(name, options);

    try {
      const result = fn(span);

      span.end();

      return result;
    } catch (error) {
      span.recordError(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      span.end();
      throw error;
    }
  }

  withSpan<F extends (...args: unknown[]) => unknown>(
    parent: SpanContextInterface,
    name: string,
    fn: (span: SpanInterface) => ReturnType<F>,
  ): ReturnType<F> {
    const span = this.startSpan(name, { parentContext: parent });

    try {
      const result = fn(span);

      span.end();

      return result;
    } catch (error) {
      span.recordError(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      span.end();
      throw error;
    }
  }

  inject(context: SpanContextInterface, carrier: Record<string, unknown>): void {
    carrier["traceparent"] = `00-${context.traceId}-${context.spanId}-01`;
    carrier["tracestate"] = context.traceState ?? "";
  }

  extract(carrier: Record<string, unknown>): SpanContextInterface | null {
    const traceparent = carrier["traceparent"];

    if (typeof traceparent !== "string") {
      return null;
    }

    const parts = traceparent.split("-");

    if (parts.length < 4) {
      return null;
    }

    const traceId = parts[1];
    const spanId = parts[2];

    if (!traceId || !spanId) {
      return null;
    }

    return {
      traceId,
      spanId,
      traceFlags: Number(parts[3]) || 1,
      traceState: typeof carrier["tracestate"] === "string" ? carrier["tracestate"] : undefined,
    };
  }
}
