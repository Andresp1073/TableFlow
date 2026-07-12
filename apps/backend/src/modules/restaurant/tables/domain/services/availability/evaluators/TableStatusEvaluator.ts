import type { AvailabilityEvaluator } from "../AvailabilityEvaluator.js";
import type { AvailabilityContext } from "../AvailabilityContext.js";
import type { AvailabilityResult } from "../AvailabilityResult.js";
import { unavailable, available } from "../AvailabilityResult.js";
import type { Table } from "../../../models/Table.js";

export interface TableRepository {
  findByIdAndRestaurant(id: string, restaurantId: string): Promise<Table | null>;
}

export class TableStatusEvaluator implements AvailabilityEvaluator {
  readonly name = "table_status";

  constructor(private readonly repository: TableRepository) {}

  async evaluate(context: AvailabilityContext): Promise<AvailabilityResult> {
    const { restaurantId } = context;
    const tableId = (context as any).tableId as string | undefined;

    if (!tableId) {
      return available();
    }

    const table = await this.repository.findByIdAndRestaurant(tableId, restaurantId);
    if (!table) {
      return available();
    }

    const status = table.status.value;

    switch (status) {
      case "available":
        return available();
      case "occupied":
        return unavailable("table_occupied", { tableId, status });
      case "reserved":
        return unavailable("table_reserved", { tableId, status });
      case "cleaning":
        return unavailable("table_cleaning", { tableId, status });
      case "blocked":
        return unavailable("table_blocked", { tableId, status });
      case "out_of_service":
        return unavailable("table_out_of_service", { tableId, status });
      case "maintenance":
        return unavailable("table_maintenance", { tableId, status });
      case "archived":
        return unavailable("table_archived", { tableId, status });
      default:
        return unavailable("unknown", { tableId, status });
    }
  }
}
