import type { AvailabilityService, AvailabilityCheckRequest } from "../ports/AvailabilityService.js";
import type { ReservationAvailabilityResult } from "../dto/AvailabilityCheckResult.js";
import { AvailabilityMapper } from "./AvailabilityMapper.js";

export interface CreateCheckInput {
  restaurantId: string;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  tableId?: string | null;
  diningAreaId?: string | null;
  tableTypeId?: string | null;
}

export interface UpdateCheckInput {
  restaurantId: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  partySize?: number;
  tableId?: string | null;
  diningAreaId?: string | null;
  tableTypeId?: string | null;
  existingDate: string;
  existingStartTime: string;
  existingEndTime: string;
  existingPartySize: number;
}

export class ReservationAvailabilityChecker {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly mapper: AvailabilityMapper,
  ) {}

  async checkBeforeCreate(input: CreateCheckInput): Promise<ReservationAvailabilityResult> {
    const request: AvailabilityCheckRequest = {
      restaurantId: input.restaurantId,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      partySize: input.partySize,
      tableId: input.tableId,
      diningAreaId: input.diningAreaId,
      tableTypeId: input.tableTypeId,
    };

    const response = await this.availabilityService.checkAvailability(request);

    const result: ReservationAvailabilityResult = {
      available: response.available,
      reason: response.reason,
      metadata: response.metadata,
    };

    this.mapper.ensureAvailable(result);
    return result;
  }

  async checkBeforeConfirm(input: CreateCheckInput): Promise<ReservationAvailabilityResult> {
    return this.checkBeforeCreate(input);
  }

  async checkBeforeUpdate(input: UpdateCheckInput): Promise<ReservationAvailabilityResult> {
    const request: AvailabilityCheckRequest = {
      restaurantId: input.restaurantId,
      date: input.date ?? input.existingDate,
      startTime: input.startTime ?? input.existingStartTime,
      endTime: input.endTime ?? input.existingEndTime,
      partySize: input.partySize ?? input.existingPartySize,
      tableId: input.tableId,
      diningAreaId: input.diningAreaId,
      tableTypeId: input.tableTypeId,
    };

    const response = await this.availabilityService.checkAvailability(request);

    const result: ReservationAvailabilityResult = {
      available: response.available,
      reason: response.reason,
      metadata: response.metadata,
    };

    this.mapper.ensureAvailable(result);
    return result;
  }
}
