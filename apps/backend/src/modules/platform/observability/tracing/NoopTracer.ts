import type {
  Tracer as TracerInterface,
  Span as SpanInterface,
  SpanContext as SpanContextInterface,
  StartSpanOptions,
} from "../types.js";
import { Span } from "./Span.js";
import { createSpanContext } from "./SpanContext.js";

export class NoopTracer implements TracerInterface {
  private currentTraceId = "0000000000000000000000000000000000000000000000000000000000000000";

  startSpan(_name: string, _options?: StartSpanOptions): SpanInterface {
    return new Span(
      {
        traceId: this.currentTraceId,
        spanId: "0000000000000000",
        isRemote: false,
        traceFlags: 0,
      },
      "noop",
    );
  }

  startActiveSpan<F extends (...args: unknown[]) => unknown>(
    _name: string,
    fn: (span: SpanInterface) => ReturnType<F>,
    _options?: StartSpanOptions,
  ): ReturnType<F> {
    const span = new Span(
      {
        traceId: this.currentTraceId,
        spanId: "0000000000000000",
        isRemote: false,
        traceFlags: 0,
      },
      "noop",
    );

    return fn(span);
  }

  withSpan<F extends (...args: unknown[]) => unknown>(
    _parent: SpanContextInterface,
    _name: string,
    fn: (span: SpanInterface) => ReturnType<F>,
  ): ReturnType<F> {
    const span = new Span(
      {
        traceId: this.currentTraceId,
        spanId: "0000000000000000",
        isRemote: false,
        traceFlags: 0,
      },
      "noop",
    );

    return fn(span);
  }

  inject(_context: SpanContextInterface, _carrier: Record<string, unknown>): void {
  }

  extract(_carrier: Record<string, unknown>): SpanContextInterface | null {
    return {
      traceId: this.currentTraceId,
      spanId: "0000000000000000",
      isRemote: true,
      traceFlags: 0,
    };
  }
}
