import { describe, it, expect } from "vitest";
import { StationAssignmentService } from "../domain/services/StationAssignmentService.js";
import { KitchenStation, StationType, StationStatus } from "../domain/models/KitchenStation.js";
import { KitchenTicket } from "../domain/models/KitchenTicket.js";
import { KitchenPriority } from "../domain/models/KitchenPriority.js";

function createStation(
  id: string,
  type: StationType,
  maxTickets: number,
  currentTickets: number,
): KitchenStation {
  return KitchenStation.create({
    id,
    kitchenId: "kitchen-1",
    name: `${type} Station`,
    type,
    status: StationStatus.Active,
    displayOrder: 1,
    maxConcurrentTickets: maxTickets,
    currentTickets,
    assignedStaff: [],
  });
}

function createTicket(stationId: string): KitchenTicket {
  return KitchenTicket.create({
    id: `ticket-${stationId}`,
    restaurantId: "rest-1",
    kitchenId: "kitchen-1",
    orderId: "order-1",
    stationId,
    priority: KitchenPriority.Normal,
    items: [],
    notes: [],
  });
}

describe("StationAssignmentService", () => {
  const service = new StationAssignmentService();

  it("assigns to preferred available station", async () => {
    const stations = [
      createStation("grill-1", StationType.Grill, 10, 2),
      createStation("grill-2", StationType.Grill, 10, 8),
    ];
    const ticket = createTicket("grill-1");

    const result = await service.assignTicketToStation(ticket, stations, "grill-1");
    expect(result.assigned).toBe(true);
    expect(result.station.id).toBe("grill-1");
  });

  it("rejects preferred station when unavailable", async () => {
    const stations = [
      createStation("grill-1", StationType.Grill, 3, 3),
      createStation("grill-2", StationType.Grill, 10, 1),
    ];
    const ticket = createTicket("grill-1");

    const result = await service.assignTicketToStation(ticket, stations, "grill-1");
    expect(result.assigned).toBe(false);
  });

  it("assigns to least loaded station", async () => {
    const stations = [
      createStation("grill-1", StationType.Grill, 10, 8),
      createStation("grill-2", StationType.Grill, 10, 2),
      createStation("grill-3", StationType.Grill, 10, 5),
    ];
    const ticket = createTicket("grill-1");

    const result = await service.assignTicketToStation(ticket, stations);
    expect(result.assigned).toBe(true);
    expect(result.station.id).toBe("grill-2");
  });

  it("releases ticket from station", () => {
    const station = createStation("grill-1", StationType.Grill, 10, 5);
    const released = service.releaseTicketFromStation(station);
    expect(released.currentTickets).toBe(4);
  });

  it("calculates station load", () => {
    const empty = createStation("s1", StationType.Grill, 10, 0);
    expect(service.getStationLoad(empty)).toBe(0);

    const half = createStation("s2", StationType.Grill, 10, 5);
    expect(service.getStationLoad(half)).toBe(0.5);

    const full = createStation("s3", StationType.Grill, 10, 10);
    expect(service.getStationLoad(full)).toBe(1);
  });

  it("finds station for item type", () => {
    const stations = [
      createStation("grill-1", StationType.Grill, 10, 0),
      createStation("bar-1", StationType.Bar, 10, 0),
      createStation("cold-1", StationType.Cold, 10, 0),
      createStation("prep-1", StationType.Preparation, 10, 0),
    ];

    expect(service.findStationForItemType("steak", stations)?.id).toBe("grill-1");
    expect(service.findStationForItemType("cocktail", stations)?.id).toBe("bar-1");
    expect(service.findStationForItemType("salad", stations)?.id).toBe("cold-1");
    expect(service.findStationForItemType("unknown", stations)?.id).toBe("prep-1");
  });

  it("sorts stations by load ascending", () => {
    const stations = [
      createStation("s1", StationType.Grill, 10, 8),
      createStation("s2", StationType.Grill, 10, 2),
      createStation("s3", StationType.Grill, 10, 5),
    ];

    const sorted = service.sortStationsByLoad(stations);
    expect(sorted[0].id).toBe("s2");
    expect(sorted[1].id).toBe("s3");
    expect(sorted[2].id).toBe("s1");
  });
});
