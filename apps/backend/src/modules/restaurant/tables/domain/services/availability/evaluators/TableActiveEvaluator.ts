import type { AvailabilityEvaluator } from "../AvailabilityEvaluator.js";
import type { AvailabilityContext } from "../AvailabilityContext.js";
import type { AvailabilityResult } from "../AvailabilityResult.js";
import { unavailable, available } from "../AvailabilityResult.js";
import type { Table } from "../../../models/Table.js";

export interface TableRepository {
  findByIdAndRestaurant(id: string, restaurantId: string): Promise<Table | null>;
}

export class TableActiveEvaluator implements AvailabilityEvaluator {
  readonly name = "table_active";

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

    if (!table.isActive) {
      return unavailable("table_inactive", { tableId });
    }

    if (table.deletedAt) {
      return unavailable("table_deleted", { tableId });
    }

    if (!table.isReservable) {
      return unavailable("table_non_reservable", { tableId });
    }

    return available();
  }
}
