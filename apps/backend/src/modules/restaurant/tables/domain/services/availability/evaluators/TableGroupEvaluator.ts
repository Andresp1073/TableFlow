import type { AvailabilityEvaluator } from "../AvailabilityEvaluator.js";
import type { AvailabilityContext } from "../AvailabilityContext.js";
import type { AvailabilityResult } from "../AvailabilityResult.js";
import { unavailable, available } from "../AvailabilityResult.js";

export interface TableGroupInfo {
  id: string;
  status: { value: string };
}

export interface TableGroupRepositoryForEval {
  findActiveGroupByTableId(tableId: string): Promise<TableGroupInfo | null>;
}

export class TableGroupEvaluator implements AvailabilityEvaluator {
  readonly name = "table_group";

  constructor(private readonly repository: TableGroupRepositoryForEval) {}

  async evaluate(context: AvailabilityContext): Promise<AvailabilityResult> {
    const tableId = (context as any).tableId as string | undefined;

    if (!tableId) {
      return available();
    }

    const group = await this.repository.findActiveGroupByTableId(tableId);
    if (!group) {
      return available();
    }

    return unavailable("table_occupied", {
      tableGroupId: group.id,
      tableGroupStatus: group.status.value,
    });
  }
}
