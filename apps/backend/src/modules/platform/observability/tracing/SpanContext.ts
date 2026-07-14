import type { SpanContext as SpanContextInterface } from "../types.js";

let nextSpanIdCounter = 0;

function generateId(): string {
  const timestamp = Date.now().toString(16).padStart(12, "0");
  const random = Math.random().toString(16).slice(2, 10).padStart(8, "0");
  const counter = (nextSpanIdCounter++ % 65536).toString(16).padStart(4, "0");

  return `${timestamp}${random}${counter}`.slice(0, 32);
}

function generateTraceId(): string {
  return generateId() + generateId();
}

function generateSpanId(): string {
  return generateId().slice(0, 16);
}

export function createSpanContext(parentContext?: SpanContextInterface): SpanContextInterface {
  return {
    traceId: parentContext?.traceId ?? generateTraceId(),
    spanId: generateSpanId(),
    parentSpanId: parentContext?.spanId,
    isRemote: false,
    traceFlags: parentContext?.traceFlags ?? 1,
  };
}

export function isValidSpanContext(context: SpanContextInterface): boolean {
  return (
    typeof context.traceId === "string" &&
    context.traceId.length > 0 &&
    typeof context.spanId === "string" &&
    context.spanId.length > 0
  );
}

export function isSpanContextValid(context: SpanContextInterface): boolean {
  return isValidSpanContext(context);
}
