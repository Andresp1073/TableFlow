import type {
  Span as SpanInterface,
  SpanContext as SpanContextInterface,
  SpanStatus,
} from "../types.js";
import { SpanStatusCode } from "../types.js";

export class Span implements SpanInterface {
  readonly spanContext: SpanContextInterface;
  private attributes: Record<string, unknown> = {};
  private events: Array<{ name: string; timestamp: string; attributes?: Record<string, unknown> }> = [];
  private status: SpanStatus = { code: SpanStatusCode.UNSET };
  private ended = false;
  private readonly startTime: string;

  constructor(
    spanContext: SpanContextInterface,
    private readonly name: string,
    attributes?: Record<string, unknown>,
    startTime?: Date,
  ) {
    this.spanContext = spanContext;
    this.startTime = startTime?.toISOString() ?? new Date().toISOString();

    if (attributes) {
      this.attributes = { ...attributes };
    }
  }

  setAttribute(key: string, value: unknown): void {
    this.attributes[key] = value;
  }

  setAttributes(attributes: Record<string, unknown>): void {
    Object.assign(this.attributes, attributes);
  }

  addEvent(name: string, attributes?: Record<string, unknown>): void {
    this.events.push({ name, timestamp: new Date().toISOString(), attributes });
  }

  setStatus(status: SpanStatus): void {
    this.status = status;
  }

  recordError(error: Error): void {
    this.status = { code: SpanStatusCode.ERROR, message: error.message };
    this.setAttribute("error.type", error.name);
    this.setAttribute("error.message", error.message);

    if (error.stack) {
      this.setAttribute("error.stack", error.stack);
    }
  }

  end(_endTime?: Date): void {
    this.ended = true;
  }

  isRecording(): boolean {
    return !this.ended;
  }

  getName(): string {
    return this.name;
  }

  getStartTime(): string {
    return this.startTime;
  }

  getAttributes(): Record<string, unknown> {
    return { ...this.attributes };
  }

  getEvents(): Array<{ name: string; timestamp: string; attributes?: Record<string, unknown> }> {
    return [...this.events];
  }

  getStatus(): SpanStatus {
    return { ...this.status };
  }
}
