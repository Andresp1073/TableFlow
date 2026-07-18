import type { AvailabilityEvaluator } from "../AvailabilityEvaluator.js";
import type { AvailabilityContext } from "../AvailabilityContext.js";
import type { AvailabilityResult } from "../AvailabilityResult.js";
import { unavailable, available } from "../AvailabilityResult.js";
import type { TableType } from "../../../../../table-types/domain/models/TableType.js";

export interface TableTypeRepository {
  findByIdAndRestaurant(id: string, restaurantId: string): Promise<TableType | null>;
}

export class TableTypeEvaluator implements AvailabilityEvaluator {
  readonly name = "table_type";

  constructor(private readonly repository: TableTypeRepository) {}

  async evaluate(context: AvailabilityContext): Promise<AvailabilityResult> {
    const { restaurantId, tableTypeId } = context;

    if (!tableTypeId) {
      return available();
    }

    const type = await this.repository.findByIdAndRestaurant(tableTypeId, restaurantId);
    if (!type) {
      return available();
    }

    if (!type.status.isActive()) {
      return unavailable("table_type_inactive", { tableTypeId });
    }

    return available();
  }
}
