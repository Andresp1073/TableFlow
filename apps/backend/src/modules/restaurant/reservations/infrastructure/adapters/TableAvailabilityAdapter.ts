import type { AvailabilityService, AvailabilityCheckRequest, AvailabilityCheckResponse } from "../../application/ports/AvailabilityService.js";
import type { AvailabilityEngine } from "../../../tables/domain/services/availability/AvailabilityEngine.js";
import type { AvailabilityContext } from "../../../tables/domain/services/availability/AvailabilityContext.js";

export class TableAvailabilityAdapter implements AvailabilityService {
  constructor(private readonly engine: AvailabilityEngine) {}

  async checkAvailability(request: AvailabilityCheckRequest): Promise<AvailabilityCheckResponse> {
    const context: AvailabilityContext = {
      restaurantId: request.restaurantId,
      date: this.extractDate(request.startTime),
      time: this.extractTime(request.startTime),
      partySize: request.partySize,
      duration: this.calculateDuration(request.startTime, request.endTime),
    };

    if (request.tableId) {
      (context as Record<string, unknown>).tableId = request.tableId;
    }

    if (request.diningAreaId) {
      (context as Record<string, unknown>).diningAreaId = request.diningAreaId;
    }

    if (request.tableTypeId) {
      (context as Record<string, unknown>).tableTypeId = request.tableTypeId;
    }

    const result = await this.engine.evaluate(context);

    return {
      available: result.available,
      reason: result.reason,
      metadata: result.metadata,
    };
  }

  private extractDate(dateTime: string): string {
    return dateTime.split("T")[0] ?? dateTime;
  }

  private extractTime(dateTime: string): string | undefined {
    const timePart = dateTime.split("T")[1];
    if (!timePart) return undefined;
    return timePart.substring(0, 5);
  }

  private calculateDuration(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return (endDate.getTime() - startDate.getTime()) / 60000;
  }
}
