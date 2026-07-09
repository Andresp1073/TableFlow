import { describe, it, expect } from "vitest";
import { RestaurantCreated } from "../domain/events/RestaurantCreated.js";
import { RestaurantActivated } from "../domain/events/RestaurantActivated.js";
import { RestaurantSuspended } from "../domain/events/RestaurantSuspended.js";
import { RestaurantArchived } from "../domain/events/RestaurantArchived.js";
import { RestaurantDeactivated } from "../domain/events/RestaurantDeactivated.js";

describe("RestaurantCreated event", () => {
  it("creates event with correct properties", () => {
    const event = new RestaurantCreated("rest-1", "My Restaurant", "my-restaurant");

    expect(event.eventName).toBe("RestaurantCreated");
    expect(event.restaurantId).toBe("rest-1");
    expect(event.name).toBe("My Restaurant");
    expect(event.slug).toBe("my-restaurant");
    expect(event.occurredAt).toBeInstanceOf(Date);
  });
});

describe("RestaurantActivated event", () => {
  it("creates event with previous status", () => {
    const event = new RestaurantActivated("rest-1", "pending");

    expect(event.eventName).toBe("RestaurantActivated");
    expect(event.restaurantId).toBe("rest-1");
    expect(event.previousStatus).toBe("pending");
    expect(event.occurredAt).toBeInstanceOf(Date);
  });
});

describe("RestaurantSuspended event", () => {
  it("creates event with optional reason", () => {
    const event = new RestaurantSuspended("rest-1", "Payment overdue");

    expect(event.eventName).toBe("RestaurantSuspended");
    expect(event.restaurantId).toBe("rest-1");
    expect(event.reason).toBe("Payment overdue");
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it("creates event without reason", () => {
    const event = new RestaurantSuspended("rest-1");

    expect(event.reason).toBeUndefined();
  });
});

describe("RestaurantArchived event", () => {
  it("creates event with all properties", () => {
    const event = new RestaurantArchived("rest-1", "inactive", "user-123");

    expect(event.eventName).toBe("RestaurantArchived");
    expect(event.restaurantId).toBe("rest-1");
    expect(event.previousStatus).toBe("inactive");
    expect(event.deletedBy).toBe("user-123");
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it("creates event without deletedBy", () => {
    const event = new RestaurantArchived("rest-1", "draft");

    expect(event.deletedBy).toBeUndefined();
  });
});

describe("RestaurantDeactivated event", () => {
  it("creates event with previous status", () => {
    const event = new RestaurantDeactivated("rest-1", "active");

    expect(event.eventName).toBe("RestaurantDeactivated");
    expect(event.restaurantId).toBe("rest-1");
    expect(event.previousStatus).toBe("active");
    expect(event.occurredAt).toBeInstanceOf(Date);
  });
});
