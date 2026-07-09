import type { Response } from "express";
import { asyncHandler } from "../../../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../../../utils/response.js";
import type { AuthenticatedRequest } from "../../../../../middlewares/auth.js";
import { ReservationPolicyApplicationService } from "../../application/services/ReservationPolicyApplicationService.js";

export function createReservationPolicyController(service: ReservationPolicyApplicationService) {
  return {
    get: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.get(
        { restaurantId: req.params.id },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),

    getOrCreate: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.getOrCreate(
        { restaurantId: req.params.id },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),

    update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      await service.getOrCreate(
        { restaurantId: req.params.id },
        req.authContext!,
      );
      const result = await service.update(
        { restaurantId: req.params.id, ...req.body },
        req.authContext!,
      );
      sendSuccess(res, result, undefined, "Reservation policy updated successfully");
    }),
  };
}
