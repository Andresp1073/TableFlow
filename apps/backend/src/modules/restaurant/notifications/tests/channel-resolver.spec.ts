import { describe, it, expect } from "vitest";
import { DefaultNotificationChannelResolver } from "../NotificationChannelResolver.js";

describe("DefaultNotificationChannelResolver", () => {
  it("resolves email, sms, in_app for ReservationCreated when contact info exists", () => {
    const resolver = new DefaultNotificationChannelResolver();

    const channels = resolver.resolve({
      eventType: "ReservationCreated",
      restaurantId: "rest-1",
      customerEmail: "test@example.com",
      customerPhone: "+1234567890",
    });

    expect(channels).toContain("email");
    expect(channels).toContain("sms");
    expect(channels).toContain("in_app");
  });

  it("excludes email when no customer email is available", () => {
    const resolver = new DefaultNotificationChannelResolver();

    const channels = resolver.resolve({
      eventType: "ReservationCreated",
      restaurantId: "rest-1",
      customerPhone: "+1234567890",
    });

    expect(channels).not.toContain("email");
    expect(channels).toContain("sms");
  });

  it("excludes sms when no customer phone is available", () => {
    const resolver = new DefaultNotificationChannelResolver();

    const channels = resolver.resolve({
      eventType: "ReservationCreated",
      restaurantId: "rest-1",
      customerEmail: "test@example.com",
    });

    expect(channels).toContain("email");
    expect(channels).not.toContain("sms");
  });

  it("resolves only in_app for ReservationCompleted", () => {
    const resolver = new DefaultNotificationChannelResolver();

    const channels = resolver.resolve({
      eventType: "ReservationCompleted",
      restaurantId: "rest-1",
    });

    expect(channels).toEqual(["in_app"]);
  });

  it("resolves sms, email, push, in_app for WaitlistPromoted", () => {
    const resolver = new DefaultNotificationChannelResolver();

    const channels = resolver.resolve({
      eventType: "WaitlistPromoted",
      restaurantId: "rest-1",
      customerEmail: "test@example.com",
      customerPhone: "+1234567890",
    });

    expect(channels).toContain("sms");
    expect(channels).toContain("email");
    expect(channels).toContain("push");
    expect(channels).toContain("in_app");
  });

  it("returns empty array for unknown event type", () => {
    const resolver = new DefaultNotificationChannelResolver();

    const channels = resolver.resolve({
      eventType: "ReservationCreated" as any,
      restaurantId: "rest-1",
    });

    expect(channels).toBeDefined();
  });

  it("supports custom overrides via constructor", () => {
    const resolver = new DefaultNotificationChannelResolver({
      ReservationCreated: ["whatsapp"],
    });

    const channels = resolver.resolve({
      eventType: "ReservationCreated",
      restaurantId: "rest-1",
      customerPhone: "+1234567890",
    });

    expect(channels).toEqual(["whatsapp"]);
  });

  it("withOverrides creates new resolver with merged overrides", () => {
    const resolver = new DefaultNotificationChannelResolver();
    const custom = resolver.withOverrides({
      ReservationCompleted: ["email", "in_app"],
    });

    const original = resolver.resolve({
      eventType: "ReservationCompleted",
      restaurantId: "rest-1",
      customerEmail: "test@example.com",
    });

    const customResult = custom.resolve({
      eventType: "ReservationCompleted",
      restaurantId: "rest-1",
      customerEmail: "test@example.com",
    });

    expect(original).toEqual(["in_app"]);
    expect(customResult).toContain("email");
    expect(customResult).toContain("in_app");
  });
});
