export interface AvailabilityCheckRequest {
  restaurantId: string;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  tableId?: string | null;
  diningAreaId?: string | null;
  tableTypeId?: string | null;
}

export interface AvailabilityCheckResponse {
  available: boolean;
  reason: string | null;
  metadata?: Record<string, unknown>;
}

export interface AvailabilityService {
  checkAvailability(request: AvailabilityCheckRequest): Promise<AvailabilityCheckResponse>;
}
