import type { Response } from "express";
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { sendSuccess, sendCreated } from "../../../../utils/response.js";
import type { AuthenticatedRequest } from "../../../../middlewares/auth.js";
import { RestaurantApplicationService } from "../../application/services/RestaurantApplicationService.js";

export function createRestaurantController(service: RestaurantApplicationService) {
  return {
    create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.create(req.body, req.authContext!);
      sendCreated(res, result, "Restaurant created successfully");
    }),

    getById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.getById({ id: req.params.id }, req.authContext!);
      sendSuccess(res, result);
    }),

    list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.list(req.query as never, req.authContext!);
      sendSuccess(res, result.data, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    }),

    update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.update(
        { id: req.params.id, ...req.body },
        req.authContext!,
      );
      sendSuccess(res, result, undefined, "Restaurant updated successfully");
    }),

    archive: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.archive(
        { id: req.params.id, deletedBy: req.userId! },
        req.authContext!,
      );
      sendSuccess(res, result, undefined, "Restaurant archived successfully");
    }),

    activate: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.activate({ id: req.params.id }, req.authContext!);
      sendSuccess(res, result, undefined, "Restaurant activated successfully");
    }),

    suspend: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.suspend(
        { id: req.params.id, reason: req.body.reason },
        req.authContext!,
      );
      sendSuccess(res, result, undefined, "Restaurant suspended successfully");
    }),
  };
}
