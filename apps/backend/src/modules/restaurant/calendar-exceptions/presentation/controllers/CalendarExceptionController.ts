import type { Response } from "express";
import { asyncHandler } from "../../../../../utils/asyncHandler.js";
import { sendSuccess, sendCreated, sendNoContent } from "../../../../../utils/response.js";
import type { AuthenticatedRequest } from "../../../../../middlewares/auth.js";
import { CalendarExceptionApplicationService } from "../../application/services/CalendarExceptionApplicationService.js";

export function createCalendarExceptionController(service: CalendarExceptionApplicationService) {
  return {
    list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const result = await service.getAll(
        { restaurantId: req.params.id, startDate, endDate },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),

    create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.create(
        { restaurantId: req.params.id, ...req.body },
        req.authContext!,
      );
      sendCreated(res, result, "Calendar exception created successfully");
    }),

    update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.update(
        { id: req.params.exceptionId, restaurantId: req.params.id, ...req.body },
        req.authContext!,
      );
      sendSuccess(res, result, undefined, "Calendar exception updated successfully");
    }),

    delete: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      await service.delete(
        { id: req.params.exceptionId, restaurantId: req.params.id },
        req.authContext!,
      );
      sendNoContent(res);
    }),
  };
}
