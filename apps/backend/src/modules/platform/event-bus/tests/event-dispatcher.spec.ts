import { describe, it, expect, vi } from "vitest";
import { EventDispatcher } from "../EventDispatcher.js";
import { EventMetadataFactory } from "../EventMetadata.js";
import type { Event, EventHandler, HandlerRegistration } from "../types.js";

function createEvent(type = "test.event", payload: Record<string, unknown> = {}): Event {
  return {
    id: "evt-1",
    type,
    occurredAt: new Date(),
    metadata: EventMetadataFactory.create({ source: "test" }),
    payload,
  };
}

function createRegistration(
  name: string,
  eventType: string,
  mode: "sync" | "async" = "sync",
  priority = 0,
  maxRetries = 0,
): HandlerRegistration {
  return {
    handler: {
      handlerName: name,
      eventType,
      mode,
      async handle(_event: Event): Promise<void> {},
    },
    priority,
    maxRetries,
    retryDelayMs: 1000,
  };
}

describe("EventDispatcher", () => {
  describe("dispatch (sync handlers)", () => {
    it("executes all sync handlers successfully", async () => {
      const dispatcher = new EventDispatcher();
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      const reg1 = createRegistration("h1", "test.event");

      reg1.handler.handle = fn1;
      const reg2 = createRegistration("h2", "test.event");

      reg2.handler.handle = fn2;

      const result = await dispatcher.dispatch(createEvent(), [reg1, reg2]);

      expect(result.handlersExecuted).toBe(2);
      expect(result.handlersFailed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it("skips async handlers during sync dispatch", async () => {
      const dispatcher = new EventDispatcher();
      const syncFn = vi.fn();
      const asyncFn = vi.fn();
      const syncReg = createRegistration("sync", "test.event", "sync");

      syncReg.handler.handle = syncFn;
      const asyncReg = createRegistration("async", "test.event", "async");

      asyncReg.handler.handle = asyncFn;

      const result = await dispatcher.dispatch(createEvent(), [syncReg, asyncReg]);

      expect(result.handlersExecuted).toBe(1);
      expect(syncFn).toHaveBeenCalledTimes(1);
      expect(asyncFn).toHaveBeenCalledTimes(0);
    });

    it("isolates handler failures", async () => {
      const dispatcher = new EventDispatcher();
      const failingReg = createRegistration("failing", "test.event");

      failingReg.handler.handle = async () => { throw new Error("handler failure"); };

      const successReg = createRegistration("success", "test.event");

      const successFn = vi.fn();

      successReg.handler.handle = successFn;

      const result = await dispatcher.dispatch(createEvent(), [failingReg, successReg]);

      expect(result.handlersExecuted).toBe(1);
      expect(result.handlersFailed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.handlerName).toBe("failing");
      expect(result.errors[0]!.error).toBe("handler failure");
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it("reports retryable flag for handlers with maxRetries > 0", async () => {
      const dispatcher = new EventDispatcher();
      const reg = createRegistration("retryable", "test.event", "sync", 0, 3);

      reg.handler.handle = async () => { throw new Error("temp error"); };

      const result = await dispatcher.dispatch(createEvent(), [reg]);

      expect(result.errors[0]!.retryable).toBe(true);
    });

    it("reports non-retryable for handlers with maxRetries === 0", async () => {
      const dispatcher = new EventDispatcher();
      const reg = createRegistration("non-retryable", "test.event");

      reg.handler.handle = async () => { throw new Error("fatal error"); };

      const result = await dispatcher.dispatch(createEvent(), [reg]);

      expect(result.errors[0]!.retryable).toBe(false);
    });
  });

  describe("dispatchAsync", () => {
    it("executes all async handlers", async () => {
      const dispatcher = new EventDispatcher();
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      const reg1 = createRegistration("async1", "test.event", "async");

      reg1.handler.handle = fn1;
      const reg2 = createRegistration("async2", "test.event", "async");

      reg2.handler.handle = fn2;

      const result = await dispatcher.dispatchAsync(createEvent(), [reg1, reg2]);

      expect(result.handlersExecuted).toBe(2);
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it("returns empty result when no async handlers", async () => {
      const dispatcher = new EventDispatcher();
      const reg = createRegistration("sync", "test.event", "sync");

      const result = await dispatcher.dispatchAsync(createEvent(), [reg]);

      expect(result.handlersExecuted).toBe(0);
      expect(result.handlersFailed).toBe(0);
    });

    it("isolates failures in async handlers", async () => {
      const dispatcher = new EventDispatcher();
      const failingReg = createRegistration("failing", "test.event", "async");

      failingReg.handler.handle = async () => { throw new Error("async failure"); };

      const successReg = createRegistration("success", "test.event", "async");

      const successFn = vi.fn();

      successReg.handler.handle = successFn;

      const result = await dispatcher.dispatchAsync(createEvent(), [failingReg, successReg]);

      expect(result.handlersExecuted).toBe(1);
      expect(result.handlersFailed).toBe(1);
      expect(successFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("dispatchAll", () => {
    it("executes both sync and async handlers", async () => {
      const dispatcher = new EventDispatcher();
      const syncFn = vi.fn();
      const asyncFn = vi.fn();
      const syncReg = createRegistration("sync", "test.event", "sync");

      syncReg.handler.handle = syncFn;
      const asyncReg = createRegistration("async", "test.event", "async");

      asyncReg.handler.handle = asyncFn;

      const result = await dispatcher.dispatchAll(createEvent(), [syncReg, asyncReg]);

      expect(result.handlersExecuted).toBe(2);
      expect(syncFn).toHaveBeenCalledTimes(1);
      expect(asyncFn).toHaveBeenCalledTimes(1);
    });
  });
});
