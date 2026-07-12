import type { Response } from "express";
import { asyncHandler } from "../../../../../utils/asyncHandler.js";
import { sendSuccess, sendCreated } from "../../../../../utils/response.js";
import type { AuthenticatedRequest } from "../../../../../middlewares/auth.js";
import type { TableApplicationService } from "../../application/services/TableApplicationService.js";

export function createTableController(service: TableApplicationService) {
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
      sendCreated(res, result, "Table created successfully");
    }),

    list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const {
        diningAreaId,
        tableTypeId,
        status,
        isReservable,
        isActive,
        minCapacity,
      } = req.query as Record<string, string | undefined>;
      const result = await service.list(
        {
          restaurantId: req.params.id,
          diningAreaId,
          tableTypeId,
          status,
          isReservable: isReservable === undefined ? undefined : isReservable === "true",
          isActive: isActive === undefined ? undefined : isActive === "true",
          minCapacity: minCapacity === undefined ? undefined : Number(minCapacity),
        },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),

    getById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.getById(
        { id: req.params.tableId, restaurantId: req.params.id },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),

    update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.update(
        { id: req.params.tableId, restaurantId: req.params.id, ...req.body },
        req.authContext!,
        {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
        },
      );
      sendSuccess(res, result, undefined, "Table updated successfully");
    }),

    archive: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.archive(
        { id: req.params.tableId, restaurantId: req.params.id },
        req.authContext!,
        {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
        },
      );
      sendSuccess(res, result, undefined, "Table archived successfully");
    }),

    changeStatus: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.changeStatus(
        { id: req.params.tableId, restaurantId: req.params.id, ...req.body },
        req.authContext!,
        {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
        },
      );
      sendSuccess(res, result, undefined, "Table status changed successfully");
    }),

    getTransitions: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.getAvailableTransitions(
        { id: req.params.tableId, restaurantId: req.params.id },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),
  };
}
