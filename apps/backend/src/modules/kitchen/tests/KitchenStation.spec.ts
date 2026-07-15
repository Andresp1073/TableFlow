import { describe, it, expect } from "vitest";
import { KitchenStation, StationType, StationStatus } from "../domain/models/KitchenStation.js";

describe("KitchenStation", () => {
  it("creates a grill station", () => {
    const station = KitchenStation.create({
      id: "grill-1",
      kitchenId: "kitchen-1",
      name: "Grill Station",
      type: StationType.Grill,
      status: StationStatus.Active,
      displayOrder: 1,
      maxConcurrentTickets: 10,
      currentTickets: 0,
      assignedStaff: [],
    });
    expect(station.type).toBe(StationType.Grill);
    expect(station.isAvailable()).toBe(true);
  });

  it("creates a custom station with label", () => {
    const station = KitchenStation.create({
      id: "custom-1",
      kitchenId: "kitchen-1",
      name: "Pizza Station",
      type: StationType.Custom,
      status: StationStatus.Active,
      displayOrder: 5,
      maxConcurrentTickets: 5,
      currentTickets: 0,
      assignedStaff: [],
      customTypeLabel: "Pizza",
    });
    expect(station.customTypeLabel).toBe("Pizza");
  });

  it("rejects custom station without label", () => {
    expect(() =>
      KitchenStation.create({
        id: "custom-2",
        kitchenId: "kitchen-1",
        name: "Bad Station",
        type: StationType.Custom,
        status: StationStatus.Active,
        displayOrder: 5,
        maxConcurrentTickets: 5,
        currentTickets: 0,
        assignedStaff: [],
      }),
    ).toThrow("Custom station type requires a label");
  });

  it("tracks availability based on capacity", () => {
    const station = KitchenStation.create({
      id: "grill-1",
      kitchenId: "kitchen-1",
      name: "Grill",
      type: StationType.Grill,
      status: StationStatus.Active,
      displayOrder: 1,
      maxConcurrentTickets: 3,
      currentTickets: 3,
      assignedStaff: [],
    });
    expect(station.canAcceptMoreTickets()).toBe(false);

    const decremented = station.decrementTickets();
    expect(decremented.currentTickets).toBe(2);
    expect(decremented.canAcceptMoreTickets()).toBe(true);
  });

  it("manages lifecycle", () => {
    const station = KitchenStation.create({
      id: "bar-1",
      kitchenId: "kitchen-1",
      name: "Bar",
      type: StationType.Bar,
      status: StationStatus.Active,
      displayOrder: 2,
      maxConcurrentTickets: 5,
      currentTickets: 0,
      assignedStaff: [],
    });

    expect(station.pause().status).toBe(StationStatus.Paused);
    expect(station.close().status).toBe(StationStatus.Closed);
    expect(station.activate().status).toBe(StationStatus.Active);
  });

  it("assigns staff", () => {
    const station = KitchenStation.create({
      id: "dessert-1",
      kitchenId: "kitchen-1",
      name: "Dessert",
      type: StationType.Dessert,
      status: StationStatus.Active,
      displayOrder: 3,
      maxConcurrentTickets: 4,
      currentTickets: 0,
      assignedStaff: [],
    });
    const assigned = station.assignStaff(["chef-1", "chef-2"]);
    expect(assigned.assignedStaff).toContain("chef-1");
    expect(assigned.assignedStaff).toContain("chef-2");
  });

  it("increments and decrements ticket count", () => {
    const station = KitchenStation.create({
      id: "prep-1",
      kitchenId: "kitchen-1",
      name: "Prep",
      type: StationType.Preparation,
      status: StationStatus.Active,
      displayOrder: 4,
      maxConcurrentTickets: 10,
      currentTickets: 0,
      assignedStaff: [],
    });
    expect(station.incrementTickets().currentTickets).toBe(1);
    expect(station.incrementTickets().incrementTickets().currentTickets).toBe(2);
    // Doesn't go below 0
    expect(station.decrementTickets().currentTickets).toBe(0);
  });

  it("identifies all station types", () => {
    const types = [
      StationType.Grill,
      StationType.Bar,
      StationType.Dessert,
      StationType.Cold,
      StationType.Preparation,
      StationType.Custom,
    ];
    for (const type of types) {
      const station = KitchenStation.create({
        id: `${type}-1`,
        kitchenId: "kitchen-1",
        name: `${type} Station`,
        type,
        status: StationStatus.Active,
        displayOrder: 1,
        maxConcurrentTickets: 5,
        currentTickets: 0,
        assignedStaff: [],
        ...(type === StationType.Custom ? { customTypeLabel: "Custom" } : {}),
      });
      expect(station.type).toBe(type);
    }
  });
});
