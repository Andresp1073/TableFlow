export interface TableAvailabilityDTO {
  tableId: string;
  available: boolean;
  reason: string | null;
  metadata?: Record<string, unknown>;
}

export interface AvailabilityCheckDTO {
  available: boolean;
  reason: string | null;
  details?: TableAvailabilityDetailDTO[];
}

export interface TableAvailabilityDetailDTO {
  evaluator: string;
  available: boolean;
  reason: string | null;
  metadata?: Record<string, unknown>;
}

export interface ListAvailableTablesResultDTO {
  availableTables: TableAvailabilityDTO[];
  totalTables: number;
  availableCount: number;
}
