import type { Response } from "express";
import { asyncHandler } from "../../../../../utils/asyncHandler.js";
import { sendSuccess, sendCreated } from "../../../../../utils/response.js";
import type { AuthenticatedRequest } from "../../../../../middlewares/auth.js";
import type { TableTypeApplicationService } from "../../application/services/TableTypeApplicationService.js";

export function createTableTypeController(service: TableTypeApplicationService) {
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
      sendCreated(res, result, "Table type created successfully");
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
        { id: req.params.tableTypeId, restaurantId: req.params.id },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),

    update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.update(
        { id: req.params.tableTypeId, restaurantId: req.params.id, ...req.body },
        req.authContext!,
        {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
        },
      );
      sendSuccess(res, result, undefined, "Table type updated successfully");
    }),

    archive: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.archive(
        { id: req.params.tableTypeId, restaurantId: req.params.id },
        req.authContext!,
        {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
        },
      );
      sendSuccess(res, result, undefined, "Table type archived successfully");
    }),
  };
}
