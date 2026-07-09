import type { Response } from "express";
import { asyncHandler } from "../../../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../../../utils/response.js";
import type { AuthenticatedRequest } from "../../../../../middlewares/auth.js";
import { BusinessHoursApplicationService } from "../../application/services/BusinessHoursApplicationService.js";

export function createBusinessHoursController(service: BusinessHoursApplicationService) {
  return {
    getOrCreate: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.getOrCreate(
        { restaurantId: req.params.id },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),

    update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      await service.getOrCreate({ restaurantId: req.params.id }, req.authContext!);
      const result = await service.update(
        { restaurantId: req.params.id, schedules: req.body.schedules },
        req.authContext!,
      );
      sendSuccess(res, result, undefined, "Business hours updated successfully");
    }),
  };
}
