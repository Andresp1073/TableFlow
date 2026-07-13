import type { Response } from "express";
import { asyncHandler } from "../../../../../utils/asyncHandler.js";
import { sendSuccess, sendCreated } from "../../../../../utils/response.js";
import type { AuthenticatedRequest } from "../../../../../middlewares/auth.js";
import type { TableGroupApplicationService } from "../../application/services/TableGroupApplicationService.js";

export function createTableGroupController(service: TableGroupApplicationService) {
  return {
    create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.create(
        { restaurantId: req.params.id, ...req.body },
        req.authContext!,
        {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
        },
      );
      sendCreated(res, result, "Table group created successfully");
    }),

    list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { status } = req.query as { status?: string };
      const result = await service.list(
        { restaurantId: req.params.id, status },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),

    getById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.getById(
        { id: req.params.groupId, restaurantId: req.params.id },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),

    update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.update(
        { id: req.params.groupId, restaurantId: req.params.id, ...req.body },
        req.authContext!,
        {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
        },
      );
      sendSuccess(res, result, undefined, "Table group updated successfully");
    }),

    release: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.release(
        { id: req.params.groupId, restaurantId: req.params.id },
        req.authContext!,
        {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
        },
      );
      sendSuccess(res, result, undefined, "Table group released successfully");
    }),
  };
}
