import { describe, it, expect, vi } from "vitest";
import { EventDispatcher } from "../EventDispatcher.js";
import { EventHandlerRegistry } from "../EventHandlerRegistry.js";
import { InMemoryEventBus } from "../InMemoryEventBus.js";
import { EventMetadataFactory } from "../EventMetadata.js";
import type { Event, EventHandler, HandlerRegistration, Logger } from "../types.js";

function createEvent(type = "test.event"): Event {
  return {
    id: "evt-1",
    type,
    occurredAt: new Date(),
    metadata: EventMetadataFactory.create(),
    payload: {},
  };
}

describe("Failure Isolation", () => {
  describe("one failing handler does not stop others (Dispatcher)", () => {
    it("continues after a sync handler throws", async () => {
      const dispatcher = new EventDispatcher();
      const executionOrder: string[] = [];

      const regs: HandlerRegistration[] = [
        {
          handler: {
            handlerName: "h1",
            eventType: "test.event",
            mode: "sync",
            async handle() { executionOrder.push("h1"); },
          },
          priority: 0,
          maxRetries: 0,
          retryDelayMs: 0,
        },
        {
          handler: {
            handlerName: "h2",
            eventType: "test.event",
            mode: "sync",
            async handle() {
              executionOrder.push("h2");
              throw new Error("h2 failed");
            },
          },
          priority: 0,
          maxRetries: 0,
          retryDelayMs: 0,
        },
        {
          handler: {
            handlerName: "h3",
            eventType: "test.event",
            mode: "sync",
            async handle() { executionOrder.push("h3"); },
          },
          priority: 0,
          maxRetries: 0,
          retryDelayMs: 0,
        },
      ];

      const result = await dispatcher.dispatch(createEvent(), regs);

      expect(result.handlersExecuted).toBe(2);
      expect(result.handlersFailed).toBe(1);
      expect(executionOrder).toEqual(["h1", "h2", "h3"]);
    });

    it("continues after an async handler throws", async () => {
      const dispatcher = new EventDispatcher();
      const successFn = vi.fn();

      const regs: HandlerRegistration[] = [
        {
          handler: {
            handlerName: "fail-async",
            eventType: "test.event",
            mode: "async",
            async handle() { throw new Error("async fail"); },
          },
          priority: 0,
          maxRetries: 0,
          retryDelayMs: 0,
        },
        {
          handler: {
            handlerName: "success-async",
            eventType: "test.event",
            mode: "async",
            async handle() { successFn(); },
          },
          priority: 0,
          maxRetries: 0,
          retryDelayMs: 0,
        },
      ];

      const result = await dispatcher.dispatchAsync(createEvent(), regs);

      expect(result.handlersExecuted).toBe(1);
      expect(result.handlersFailed).toBe(1);
      expect(successFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("error isolation in InMemoryEventBus", () => {
    it("reports failed handlers in stats", async () => {
      const bus = new InMemoryEventBus();

      await bus.start();

      bus.subscribe({
        handlerName: "failing-handler",
        eventType: "test.event",
        mode: "sync",
        async handle() { throw new Error("something broke"); },
      });

      bus.subscribe({
        handlerName: "success-handler",
        eventType: "test.event",
        mode: "sync",
        async handle() {},
      });

      await bus.publish(createEvent("test.event"));

      const stats = bus.getStats();

      expect(stats.totalEventsPublished).toBe(1);
      expect(stats.totalHandlersExecuted).toBe(1);
      expect(stats.failedHandlers).toBe(1);
    });

    it("all handlers run even when some fail", async () => {
      const bus = new InMemoryEventBus();
      const successFn = vi.fn();

      await bus.start();

      bus.subscribe({
        handlerName: "fail-1",
        eventType: "multi.event",
        mode: "sync",
        async handle() { throw new Error("error 1"); },
      });

      bus.subscribe({
        handlerName: "success",
        eventType: "multi.event",
        mode: "sync",
        async handle() { successFn(); },
      });

      bus.subscribe({
        handlerName: "fail-2",
        eventType: "multi.event",
        mode: "sync",
        async handle() { throw new Error("error 2"); },
      });

      await bus.publish(createEvent("multi.event"));

      expect(successFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("dispatcher with logger does not throw", () => {
    it("logger receives error details", async () => {
      const dispatcher = new EventDispatcher();
      const debugFn = vi.fn();
      const infoFn = vi.fn();
      const warnFn = vi.fn();
      const errorFn = vi.fn();
      const logger: Logger = {
        debug: debugFn,
        info: infoFn,
        warn: warnFn,
        error: errorFn,
        fatal: vi.fn(),
        log: vi.fn(),
        child: () => logger,
      };

      const regs: HandlerRegistration[] = [
        {
          handler: {
            handlerName: "logger-test",
            eventType: "test.event",
            mode: "sync",
            async handle() { throw new Error("logged error"); },
          },
          priority: 0,
          maxRetries: 3,
          retryDelayMs: 1000,
        },
      ];

      const result = await dispatcher.dispatch(createEvent(), regs, logger);

      expect(result.handlersFailed).toBe(1);
      expect(errorFn).toHaveBeenCalledWith(
        expect.stringContaining("logger-test"),
        expect.objectContaining({ handlerName: "logger-test" }),
      );
    });
  });
});
