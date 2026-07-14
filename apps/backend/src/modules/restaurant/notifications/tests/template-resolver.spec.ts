import { describe, it, expect } from "vitest";
import { DefaultNotificationTemplateResolver } from "../NotificationTemplateResolver.js";

describe("DefaultNotificationTemplateResolver", () => {
  it("resolves ReservationCreated email template", () => {
    const resolver = new DefaultNotificationTemplateResolver();

    const template = resolver.resolve("ReservationCreated", "email", {
      eventType: "ReservationCreated",
      restaurantId: "rest-1",
      partySize: 4,
      date: new Date("2026-07-14"),
      startTime: new Date("2026-07-14T18:00:00Z"),
    });

    expect(template.subject).toContain("Reservation Confirmed");
    expect(template.body).toContain("4");
    expect(template.body).toContain("rest-1");
    expect(template.channel).toBe("email");
    expect(template.eventType).toBe("ReservationCreated");
  });

  it("resolves ReservationCreated sms template", () => {
    const resolver = new DefaultNotificationTemplateResolver();

    const template = resolver.resolve("ReservationCreated", "sms", {
      eventType: "ReservationCreated",
      restaurantId: "rest-1",
      partySize: 2,
    });

    expect(template.subject).toContain("Reservation Confirmed");
    expect(template.body).toContain("TableFlow");
    expect(template.body).toContain("2");
  });

  it("resolves WaitlistPromoted push template", () => {
    const resolver = new DefaultNotificationTemplateResolver();

    const template = resolver.resolve("WaitlistPromoted", "push", {
      eventType: "WaitlistPromoted",
      restaurantId: "rest-1",
      partySize: 4,
    });

    expect(template.subject).toBe("Table Ready");
    expect(template.body).toContain("4");
  });

  it("returns fallback template for unknown event-channel combination", () => {
    const resolver = new DefaultNotificationTemplateResolver();

    const template = resolver.resolve("ReservationNoShow", "whatsapp", {
      eventType: "ReservationNoShow",
      restaurantId: "rest-1",
    });

    expect(template.subject).toContain("Notification");
    expect(template.body).toContain("ReservationNoShow");
  });

  it("fills template placeholders with context data", () => {
    const resolver = new DefaultNotificationTemplateResolver();

    const template = resolver.resolve("ReservationCreated", "email", {
      eventType: "ReservationCreated",
      restaurantId: "rest-123",
      partySize: 6,
      date: new Date("2026-12-25"),
      startTime: new Date("2026-12-25T19:00:00Z"),
      reservationId: "res-xyz",
      customerId: "cust-abc",
    });

    expect(template.body).toContain("6");
    expect(template.body).toContain("rest-123");
    expect(template.body).not.toContain("{partySize}");
    expect(template.body).not.toContain("{restaurantId}");
  });

  it("handles missing optional context gracefully", () => {
    const resolver = new DefaultNotificationTemplateResolver();

    const template = resolver.resolve("ReservationCreated", "email", {
      eventType: "ReservationCreated",
      restaurantId: "rest-1",
    });

    expect(template.body).not.toContain("undefined");
  });
});
