import type { Response } from "express";
import { asyncHandler } from "../../../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../../../utils/response.js";
import type { AuthenticatedRequest } from "../../../../../middlewares/auth.js";
import { RestaurantSettingsApplicationService } from "../../application/services/RestaurantSettingsApplicationService.js";

export function createRestaurantSettingsController(service: RestaurantSettingsApplicationService) {
  return {
    get: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.get(
        { restaurantId: String(req.params['id']) },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),

    getOrCreate: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.getOrCreate(
        { restaurantId: String(req.params['id']) },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),

    update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      await service.getOrCreate(
        { restaurantId: String(req.params['id']) },
        req.authContext!,
      );
      const result = await service.update(
        { restaurantId: String(req.params['id']), ...req.body },
        req.authContext!,
      );
      sendSuccess(res, result, undefined, "Restaurant settings updated successfully");
    }),
  };
}
