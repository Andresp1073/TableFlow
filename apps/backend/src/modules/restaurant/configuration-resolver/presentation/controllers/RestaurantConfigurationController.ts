import type { Response } from "express";
import type { AuthenticatedRequest } from "../../../../../middlewares/auth.js";
import { asyncHandler } from "../../../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../../../utils/response.js";
import type { RestaurantConfigurationService } from "../../application/services/RestaurantConfigurationService.js";

export function createRestaurantConfigurationController(service: RestaurantConfigurationService) {
  return {
    get: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.get(
        { restaurantId: req.params.id },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),

    refresh: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.refresh(
        { restaurantId: req.params.id },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),
  };
}
