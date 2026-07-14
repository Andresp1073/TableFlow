import { describe, it, expect, vi, beforeEach } from "vitest";
import { InMemoryEventBus } from "../InMemoryEventBus.js";
import { EventMetadataFactory } from "../EventMetadata.js";
import { DomainEvent } from "../Event.js";
import type { Event, EventHandler, EventBusStats } from "../types.js";

function createEvent(type = "test.event", payload: Record<string, unknown> = {}): Event {
  return {
    id: "evt-1",
    type,
    occurredAt: new Date(),
    metadata: EventMetadataFactory.create({ source: "test" }),
    payload,
  };
}

describe("InMemoryEventBus", () => {
  describe("lifecycle", () => {
    it("is not running before start", () => {
      const bus = new InMemoryEventBus();

      expect(bus.isRunning()).toBe(false);
    });

    it("becomes running after start", async () => {
      const bus = new InMemoryEventBus();

      await bus.start();

      expect(bus.isRunning()).toBe(true);
    });

    it("stops running after stop", async () => {
      const bus = new InMemoryEventBus();

      await bus.start();
      await bus.stop();

      expect(bus.isRunning()).toBe(false);
    });

    it("throws when publishing before start", async () => {
      const bus = new InMemoryEventBus();

      await expect(bus.publish(createEvent())).rejects.toThrow("EventBus is not running");
    });
  });

  describe("publish and subscribe", () => {
    it("delivers event to subscribed handler", async () => {
      const bus = new InMemoryEventBus();
      const handler = vi.fn();

      await bus.start();

      bus.subscribe({
        handlerName: "test-handler",
        eventType: "test.event",
        mode: "sync",
        async handle(event) { handler(event); },
      });

      const event = createEvent("test.event", { key: "value" });

      await bus.publish(event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event);
    });

    it("delivers to multiple subscribers of the same event type", async () => {
      const bus = new InMemoryEventBus();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      await bus.start();

      bus.subscribe({
        handlerName: "h1",
        eventType: "multi.event",
        mode: "sync",
        async handle(e) { handler1(e); },
      });
      bus.subscribe({
        handlerName: "h2",
        eventType: "multi.event",
        mode: "sync",
        async handle(e) { handler2(e); },
      });

      await bus.publish(createEvent("multi.event"));

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("does not deliver events to handlers of different types", async () => {
      const bus = new InMemoryEventBus();
      const handler = vi.fn();

      await bus.start();

      bus.subscribe({
        handlerName: "h1",
        eventType: "other.event",
        mode: "sync",
        async handle(e) { handler(e); },
      });

      await bus.publish(createEvent("test.event"));

      expect(handler).not.toHaveBeenCalled();
    });

    it("unsubscribe removes handler", async () => {
      const bus = new InMemoryEventBus();
      const handler = vi.fn();

      await bus.start();

      bus.subscribe({
        handlerName: "h1",
        eventType: "test.event",
        mode: "sync",
        async handle(e) { handler(e); },
      });

      bus.unsubscribe("test.event", "h1");

      await bus.publish(createEvent("test.event"));

      expect(handler).not.toHaveBeenCalled();
    });

    it("hasSubscriber checks handler existence", async () => {
      const bus = new InMemoryEventBus();

      await bus.start();

      bus.subscribe({
        handlerName: "h1",
        eventType: "test.event",
        mode: "sync",
        async handle() {},
      });

      expect(bus.hasSubscriber("test.event", "h1")).toBe(true);
      expect(bus.hasSubscriber("test.event", "nonexistent")).toBe(false);
    });
  });

  describe("publishMany", () => {
    it("publishes multiple events", async () => {
      const bus = new InMemoryEventBus();
      const handler = vi.fn();

      await bus.start();

      bus.subscribe({
        handlerName: "h1",
        eventType: "test.event",
        mode: "sync",
        async handle(e) { handler(e); },
      });

      await bus.publishMany([createEvent("test.event"), createEvent("test.event")]);

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe("stats", () => {
    it("tracks published events", async () => {
      const bus = new InMemoryEventBus();

      await bus.start();
      await bus.publish(createEvent("test.event"));

      const stats = bus.getStats();

      expect(stats.totalEventsPublished).toBe(1);
    });

    it("tracks executed handlers", async () => {
      const bus = new InMemoryEventBus();

      await bus.start();

      bus.subscribe({
        handlerName: "h1",
        eventType: "test.event",
        mode: "sync",
        async handle() {},
      });
      bus.subscribe({
        handlerName: "h2",
        eventType: "test.event",
        mode: "sync",
        async handle() {},
      });

      await bus.publish(createEvent("test.event"));

      expect(bus.getStats().totalHandlersExecuted).toBe(2);
    });

    it("tracks failed handlers", async () => {
      const bus = new InMemoryEventBus();

      await bus.start();

      bus.subscribe({
        handlerName: "failing",
        eventType: "test.event",
        mode: "sync",
        async handle() { throw new Error("fail"); },
      });

      await bus.publish(createEvent("test.event"));

      expect(bus.getStats().failedHandlers).toBe(1);
    });

    it("tracks registered handler count", async () => {
      const bus = new InMemoryEventBus();

      bus.subscribe({
        handlerName: "h1",
        eventType: "a",
        mode: "sync",
        async handle() {},
      });
      bus.subscribe({
        handlerName: "h2",
        eventType: "b",
        mode: "sync",
        async handle() {},
      });

      expect(bus.getStats().registeredHandlers).toBe(2);
    });

    it("tracks uptime after start", async () => {
      const bus = new InMemoryEventBus();

      await bus.start();

      const stats = bus.getStats();

      expect(stats.uptimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("clear", () => {
    it("resets all state", async () => {
      const bus = new InMemoryEventBus();

      await bus.start();

      bus.subscribe({
        handlerName: "h1",
        eventType: "test.event",
        mode: "sync",
        async handle() {},
      });

      await bus.publish(createEvent("test.event"));
      bus.clear();

      const stats = bus.getStats();

      expect(stats.totalEventsPublished).toBe(0);
      expect(stats.totalHandlersExecuted).toBe(0);
      expect(stats.registeredHandlers).toBe(0);
    });
  });

  describe("domain events", () => {
    it("publishes DomainEvent instances", async () => {
      const bus = new InMemoryEventBus();
      const handler = vi.fn();

      await bus.start();

      bus.subscribe({
        handlerName: "domain-handler",
        eventType: "reservation.created",
        mode: "sync",
        async handle(e) { handler(e); },
      });

      const domainEvent = new DomainEvent(
        "reservation.created",
        "agg-123",
        "reservation",
        { partySize: 4 },
        1,
        { source: "reservation-service" },
      );

      await bus.publish(domainEvent);

      expect(handler).toHaveBeenCalledWith(domainEvent);
      expect(domainEvent.aggregateId).toBe("agg-123");
      expect(domainEvent.aggregateType).toBe("reservation");
      expect(domainEvent.domainVersion).toBe(1);
    });
  });
});
