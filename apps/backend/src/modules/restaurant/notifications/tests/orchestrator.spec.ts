import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventBus } from "../../../../events/EventBus.js";
import { NotificationOrchestrator } from "../NotificationOrchestrator.js";
import { NotificationDispatcher } from "../NotificationDispatcher.js";
import { DefaultNotificationChannelResolver } from "../NotificationChannelResolver.js";
import { DefaultNotificationTemplateResolver } from "../NotificationTemplateResolver.js";
import { InMemoryNotificationQueue } from "../NotificationQueue.js";
import {
  ReservationCreated,
  ReservationConfirmed,
  ReservationCancelled,
  ReservationCompleted,
  ReservationNoShow,
} from "../../reservations/domain/events/ReservationEvents.js";
import { DefaultNotificationChannelResolver } from "../NotificationChannelResolver.js";
import { DefaultNotificationTemplateResolver } from "../NotificationTemplateResolver.js";
import { InMemoryNotificationQueue } from "../NotificationQueue.js";

describe("NotificationOrchestrator", () => {
  let eventBus: EventBus;
  let dispatcher: NotificationDispatcher;
  let orchestrator: NotificationOrchestrator;
  let dispatchSpy: any;

  beforeEach(() => {
    eventBus = new EventBus();
    dispatcher = new NotificationDispatcher(
      new DefaultNotificationChannelResolver(),
      new DefaultNotificationTemplateResolver(),
      new InMemoryNotificationQueue(),
    );
    dispatchSpy = vi.spyOn(dispatcher, "dispatch");
    orchestrator = new NotificationOrchestrator({ eventBus, dispatcher });
  });

  afterEach(() => {
    orchestrator.stop();
  });

  it("subscribes to events on start", () => {
    expect(orchestrator.isStarted()).toBe(false);

    orchestrator.start();

    expect(orchestrator.isStarted()).toBe(true);
    expect(eventBus.listenerCount("ReservationCreated")).toBe(1);
    expect(eventBus.listenerCount("ReservationConfirmed")).toBe(1);
    expect(eventBus.listenerCount("ReservationCancelled")).toBe(1);
    expect(eventBus.listenerCount("ReservationCompleted")).toBe(1);
    expect(eventBus.listenerCount("ReservationNoShow")).toBe(1);
  });

  it("unsubscribes from events on stop", () => {
    orchestrator.start();
    orchestrator.stop();

    expect(orchestrator.isStarted()).toBe(false);
    expect(eventBus.listenerCount("ReservationCreated")).toBe(0);
  });

  it("handles ReservationCreated event", async () => {
    orchestrator.start();

    const event = new ReservationCreated("res-1", "rest-1", "RES-001", 4, "user-1");
    await eventBus.emit("ReservationCreated", event);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "ReservationCreated",
        restaurantId: "rest-1",
        reservationId: "res-1",
        partySize: 4,
        metadata: expect.objectContaining({
          reservationNumber: "RES-001",
          createdBy: "user-1",
        }),
      }),
    );
  });

  it("handles ReservationConfirmed event", async () => {
    orchestrator.start();

    const event = new ReservationConfirmed("res-1", "rest-1", "RES-001");
    await eventBus.emit("ReservationConfirmed", event);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "ReservationConfirmed",
        restaurantId: "rest-1",
        reservationId: "res-1",
      }),
    );
  });

  it("handles ReservationCancelled event", async () => {
    orchestrator.start();

    const event = new ReservationCancelled("res-1", "rest-1", "RES-001", "user-1");
    await eventBus.emit("ReservationCancelled", event);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "ReservationCancelled",
        restaurantId: "rest-1",
        metadata: expect.objectContaining({
          cancelledBy: "user-1",
        }),
      }),
    );
  });

  it("handles ReservationCompleted event", async () => {
    orchestrator.start();

    const event = new ReservationCompleted("res-1", "rest-1", "RES-001");
    await eventBus.emit("ReservationCompleted", event);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "ReservationCompleted",
      }),
    );
  });

  it("handles ReservationNoShow event", async () => {
    orchestrator.start();

    const event = new ReservationNoShow("res-1", "rest-1", "RES-001");
    await eventBus.emit("ReservationNoShow", event);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "ReservationNoShow",
      }),
    );
  });

  it("does not subscribe twice when start is called multiple times", () => {
    orchestrator.start();
    orchestrator.start();

    expect(eventBus.listenerCount("ReservationCreated")).toBe(1);
  });

  it("does not dispatch when orchestrator is not started", async () => {
    const event = new ReservationCreated("res-1", "rest-1", "RES-001", 4, "user-1");
    await eventBus.emit("ReservationCreated", event);

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it("handles external events via handleExternalEvent", async () => {
    await orchestrator.handleExternalEvent("ReservationCreated", {
      restaurantId: "rest-1",
      partySize: 4,
      customerEmail: "test@example.com",
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "ReservationCreated",
        restaurantId: "rest-1",
        partySize: 4,
        customerEmail: "test@example.com",
      }),
    );
  });
});
