import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationDispatcher } from "../NotificationDispatcher.js";
import { DefaultNotificationChannelResolver } from "../NotificationChannelResolver.js";
import { DefaultNotificationTemplateResolver } from "../NotificationTemplateResolver.js";
import { InMemoryNotificationQueue } from "../NotificationQueue.js";
import type { NotificationChannelProvider } from "../NotificationChannelProvider.js";

describe("NotificationDispatcher", () => {
  let resolver: DefaultNotificationChannelResolver;
  let templateResolver: DefaultNotificationTemplateResolver;
  let queue: InMemoryNotificationQueue;
  let dispatcher: NotificationDispatcher;

  beforeEach(() => {
    resolver = new DefaultNotificationChannelResolver();
    templateResolver = new DefaultNotificationTemplateResolver();
    queue = new InMemoryNotificationQueue();
    dispatcher = new NotificationDispatcher(resolver, templateResolver, queue);
  });

  it("skips dispatch when no recipient is available", async () => {
    const result = await dispatcher.dispatch({
      eventType: "ReservationCreated",
      restaurantId: "rest-1",
    });

    expect(result.overallStatus).toBe("skipped");
    expect(result.error).toContain("No recipient");
  });

  it("skips dispatch when no channels resolve", async () => {
    const customResolver = new DefaultNotificationChannelResolver({
      ReservationCreated: [],
    });
    const customDispatcher = new NotificationDispatcher(
      customResolver,
      templateResolver,
      queue,
    );

    const result = await customDispatcher.dispatch({
      eventType: "ReservationCreated",
      restaurantId: "rest-1",
      customerEmail: "test@example.com",
    });

    expect(result.overallStatus).toBe("skipped");
    expect(result.error).toContain("No channels");
  });

  it("queues messages when no provider is registered", async () => {
    const result = await dispatcher.dispatch({
      eventType: "ReservationCreated",
      restaurantId: "rest-1",
      customerEmail: "test@example.com",
      customerPhone: "+1234567890",
    });

    expect(result.overallStatus).toBe("sent");
    expect(result.channelResults).toHaveLength(3);
    expect(result.channelResults.every((r) => r.status === "queued")).toBe(true);

    const queueLength = await queue.length();
    expect(queueLength).toBe(3);
  });

  it("sends via registered provider", async () => {
    const mockProvider: NotificationChannelProvider = {
      channelType: "email",
      send: vi.fn().mockResolvedValue({
        status: "sent",
        channel: "email",
        messageId: "msg-1",
        providerMessageId: "prov-1",
        deliveredAt: new Date(),
      }),
    };

    const customDispatcher = new NotificationDispatcher(
      resolver,
      templateResolver,
      queue,
      [mockProvider],
    );

    const result = await customDispatcher.dispatch({
      eventType: "ReservationCreated",
      restaurantId: "rest-1",
      customerEmail: "test@example.com",
    });

    expect(result.overallStatus).toBe("sent");
    expect(result.successfulChannels).toBe(1);
    expect(result.channelResults[0]?.status).toBe("sent");
    expect(mockProvider.send).toHaveBeenCalledOnce();
  });

  it("handles provider failure gracefully", async () => {
    const mockProvider: NotificationChannelProvider = {
      channelType: "email",
      send: vi.fn().mockRejectedValue(new Error("Provider unavailable")),
    };

    const customDispatcher = new NotificationDispatcher(
      new DefaultNotificationChannelResolver({
        ReservationCreated: ["email"],
      }),
      templateResolver,
      queue,
      [mockProvider],
    );

    const result = await customDispatcher.dispatch({
      eventType: "ReservationCreated",
      restaurantId: "rest-1",
      customerEmail: "test@example.com",
    });

    expect(result.overallStatus).toBe("failed");
    expect(result.failedChannels).toBe(1);
  });

  it("registers new provider after construction", async () => {
    const mockProvider: NotificationChannelProvider = {
      channelType: "email",
      send: vi.fn().mockResolvedValue({
        status: "sent",
        channel: "email",
        messageId: "msg-1",
        deliveredAt: new Date(),
      }),
    };

    dispatcher.registerProvider(mockProvider);

    const result = await dispatcher.dispatch({
      eventType: "ReservationCreated",
      restaurantId: "rest-1",
      customerEmail: "test@example.com",
    });

    const emailResult = result.channelResults.find((r) => r.channel === "email");
    expect(emailResult?.status).toBe("sent");
  });

  it("processes queued messages", async () => {
    const mockProvider: NotificationChannelProvider = {
      channelType: "email",
      send: vi.fn().mockResolvedValue({
        status: "sent",
        channel: "email",
        messageId: "msg-1",
        deliveredAt: new Date(),
      }),
    };

    const customDispatcher = new NotificationDispatcher(
      new DefaultNotificationChannelResolver({
        ReservationCreated: ["email"],
      }),
      templateResolver,
      queue,
    );

    await customDispatcher.dispatch({
      eventType: "ReservationCreated",
      restaurantId: "rest-1",
      customerEmail: "test@example.com",
    });

    customDispatcher.registerProvider(mockProvider);

    const results = await customDispatcher.processQueue();

    expect(results.length).toBeGreaterThan(0);
    expect(mockProvider.send).toHaveBeenCalled();
  });

  it("handles partial delivery (some fail, some succeed)", async () => {
    const emailProvider: NotificationChannelProvider = {
      channelType: "email",
      send: vi.fn().mockResolvedValue({
        status: "sent",
        channel: "email",
        messageId: "msg-1",
        deliveredAt: new Date(),
      }),
    };

    const smsProvider: NotificationChannelProvider = {
      channelType: "sms",
      send: vi.fn().mockRejectedValue(new Error("SMS provider down")),
    };

    const customDispatcher = new NotificationDispatcher(
      new DefaultNotificationChannelResolver({
        ReservationCreated: ["email", "sms"],
      }),
      templateResolver,
      queue,
      [emailProvider, smsProvider],
    );

    const result = await customDispatcher.dispatch({
      eventType: "ReservationCreated",
      restaurantId: "rest-1",
      customerEmail: "test@example.com",
      customerPhone: "+1234567890",
    });

    expect(result.successfulChannels).toBe(1);
    expect(result.failedChannels).toBe(1);
    expect(result.overallStatus).toBe("sent");
  });
});
