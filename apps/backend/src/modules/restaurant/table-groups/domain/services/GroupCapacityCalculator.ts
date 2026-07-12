export interface TableCapacitySource {
  maximumCapacity: { value: number };
}

export class GroupCapacityCalculator {
  calculate(tables: TableCapacitySource[]): number {
    return tables.reduce((sum, table) => sum + table.maximumCapacity.value, 0);
  }
}
