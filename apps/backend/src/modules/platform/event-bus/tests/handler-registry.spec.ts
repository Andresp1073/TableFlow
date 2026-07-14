import { describe, it, expect } from "vitest";
import { EventHandlerRegistry } from "../EventHandlerRegistry.js";
import type { EventHandler, Event } from "../types.js";

function createHandler(name: string, eventType: string, mode: "sync" | "async" = "sync"): EventHandler {
  return {
    handlerName: name,
    eventType,
    mode,
    async handle(_event: Event): Promise<void> {},
  };
}

describe("EventHandlerRegistry", () => {
  it("registers and retrieves a handler", () => {
    const registry = new EventHandlerRegistry();
    const handler = createHandler("h1", "reservation.created");

    registry.register(handler);

    const registrations = registry.getRegistrations("reservation.created");

    expect(registrations).toHaveLength(1);
    expect(registrations[0]!.handler.handlerName).toBe("h1");
  });

  it("returns empty array for unregistered event type", () => {
    const registry = new EventHandlerRegistry();

    expect(registry.getRegistrations("nonexistent")).toEqual([]);
  });

  it("unregisters a handler", () => {
    const registry = new EventHandlerRegistry();
    const handler = createHandler("h1", "test.event");

    registry.register(handler);
    registry.unregister("test.event", "h1");

    expect(registry.hasHandler("test.event", "h1")).toBe(false);
  });

  it("unregisters removes event type when no handlers remain", () => {
    const registry = new EventHandlerRegistry();
    const handler = createHandler("h1", "test.event");

    registry.register(handler);
    registry.unregister("test.event", "h1");

    expect(registry.listEventTypes()).not.toContain("test.event");
  });

  it("hasHandler returns true for registered handler", () => {
    const registry = new EventHandlerRegistry();
    const handler = createHandler("h1", "test.event");

    registry.register(handler);

    expect(registry.hasHandler("test.event", "h1")).toBe(true);
  });

  it("hasHandler returns false for unregistered handler", () => {
    const registry = new EventHandlerRegistry();

    expect(registry.hasHandler("test.event", "h1")).toBe(false);
  });

  it("lists all event types", () => {
    const registry = new EventHandlerRegistry();

    registry.register(createHandler("h1", "event.a"));
    registry.register(createHandler("h2", "event.b"));

    const types = registry.listEventTypes();

    expect(types).toHaveLength(2);
    expect(types).toContain("event.a");
    expect(types).toContain("event.b");
  });

  it("lists handlers for specific event type", () => {
    const registry = new EventHandlerRegistry();

    registry.register(createHandler("h1", "event.a"));
    registry.register(createHandler("h2", "event.a"));
    registry.register(createHandler("h3", "event.b"));

    const handlers = registry.listHandlers("event.a");

    expect(handlers).toHaveLength(2);
  });

  it("lists all handlers when no event type specified", () => {
    const registry = new EventHandlerRegistry();

    registry.register(createHandler("h1", "event.a"));
    registry.register(createHandler("h2", "event.b"));

    const all = registry.listHandlers();

    expect(all).toHaveLength(2);
  });

  it("sorts handlers by priority descending", () => {
    const registry = new EventHandlerRegistry();

    registry.register(createHandler("low"), { priority: 0 });
    registry.register(createHandler("high"), { priority: 100 });
    registry.register(createHandler("medium"), { priority: 50 });

    const registrations = registry.listHandlers();

    expect(registrations[0]!.handler.handlerName).toBe("high");
    expect(registrations[1]!.handler.handlerName).toBe("medium");
    expect(registrations[2]!.handler.handlerName).toBe("low");
  });

  it("count returns total number of handler registrations", () => {
    const registry = new EventHandlerRegistry();

    expect(registry.count()).toBe(0);

    registry.register(createHandler("h1", "event.a"));
    registry.register(createHandler("h2", "event.a"));
    registry.register(createHandler("h3", "event.b"));

    expect(registry.count()).toBe(3);
  });

  it("clear removes all registrations", () => {
    const registry = new EventHandlerRegistry();

    registry.register(createHandler("h1", "event.a"));
    registry.clear();

    expect(registry.count()).toBe(0);
    expect(registry.listEventTypes()).toHaveLength(0);
  });

  it("registration stores custom maxRetries and retryDelayMs", () => {
    const registry = new EventHandlerRegistry();
    const handler = createHandler("h1", "event.a");

    registry.register(handler, { maxRetries: 3, retryDelayMs: 5000 });

    const registrations = registry.getRegistrations("event.a");

    expect(registrations[0]!.maxRetries).toBe(3);
    expect(registrations[0]!.retryDelayMs).toBe(5000);
  });
});
