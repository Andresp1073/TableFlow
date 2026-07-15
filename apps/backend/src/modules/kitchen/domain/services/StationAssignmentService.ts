import type { KitchenStation } from "../models/KitchenStation.js";
import { StationStatus } from "../models/KitchenStation.js";
import type { KitchenTicket } from "../models/KitchenTicket.js";

export interface StationAssignmentResult {
  station: KitchenStation;
  assigned: boolean;
  reason?: string;
}

export class StationAssignmentService {
  async assignTicketToStation(
    ticket: KitchenTicket,
    availableStations: KitchenStation[],
    preferredStationId?: string,
  ): Promise<StationAssignmentResult> {
    if (preferredStationId) {
      const preferred = availableStations.find((s) => s.id === preferredStationId);
      if (preferred && preferred.isAvailable()) {
        return {
          station: preferred.incrementTickets(),
          assigned: true,
        };
      }
      return {
        station: preferred!,
        assigned: false,
        reason: "Preferred station is not available",
      };
    }

    const sorted = this.sortStationsByLoad(availableStations);

    for (const station of sorted) {
      if (station.isAvailable()) {
        return {
          station: station.incrementTickets(),
          assigned: true,
        };
      }
    }

    return {
      station: sorted[0],
      assigned: false,
      reason: "No available stations",
    };
  }

  releaseTicketFromStation(
    station: KitchenStation,
  ): KitchenStation {
    return station.decrementTickets();
  }

  getStationLoad(station: KitchenStation): number {
    if (station.maxConcurrentTickets === 0) return 1;
    return station.currentTickets / station.maxConcurrentTickets;
  }

  sortStationsByLoad(stations: KitchenStation[]): KitchenStation[] {
    return [...stations].sort(
      (a, b) => this.getStationLoad(a) - this.getStationLoad(b),
    );
  }

  findStationForItemType(
    itemType: string,
    stations: KitchenStation[],
  ): KitchenStation | null {
    const active = stations.filter((s) => s.status === StationStatus.Active);

    const typeMap: Record<string, string> = {
      grill: "grill",
      fry: "grill",
      steak: "grill",
      burger: "grill",
      cocktail: "bar",
      beer: "bar",
      wine: "bar",
      dessert: "dessert",
      ice_cream: "dessert",
      cake: "dessert",
      salad: "cold",
      cold: "cold",
      appetizer: "cold",
      prep: "preparation",
    };

    const stationType = typeMap[itemType.toLowerCase()] ?? "preparation";
    return active.find((s) => s.type === stationType) ?? null;
  }
}
