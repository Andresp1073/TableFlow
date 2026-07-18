import type { Response } from "express";
import { asyncHandler } from "../../../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../../../utils/response.js";
import type { AuthenticatedRequest } from "../../../../../middlewares/auth.js";
import type { TableAvailabilityService } from "../../application/services/TableAvailabilityService.js";

export function createTableAvailabilityController(service: TableAvailabilityService) {
  return {
    checkAvailability: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { date, time, partySize, duration } = req.query as Record<string, string | undefined>;
      const result = await service.checkTableAvailability(
        {
          restaurantId: String(req.params['id']),
          tableId: String(req.params['tableId']),
          date: date!,
          time,
          partySize: partySize ? Number(partySize) : undefined,
          duration: duration ? Number(duration) : undefined,
        },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),

    listAvailableTables: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const {
        date,
        time,
        partySize,
        duration,
        diningAreaId,
        tableTypeId,
        minCapacity,
        maxCapacity,
        isAccessible,
      } = req.query as Record<string, string | undefined>;
      const result = await service.listAvailableTables(
        {
          restaurantId: String(req.params['id']),
          date: date!,
          time,
          partySize: partySize ? Number(partySize) : undefined,
          duration: duration ? Number(duration) : undefined,
          diningAreaId,
          tableTypeId,
          minCapacity: minCapacity ? Number(minCapacity) : undefined,
          maxCapacity: maxCapacity ? Number(maxCapacity) : undefined,
          isAccessible: isAccessible === undefined ? undefined : isAccessible === "true",
        },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),
  };
}
