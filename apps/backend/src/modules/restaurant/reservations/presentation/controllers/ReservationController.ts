import type { Response } from "express";
import { asyncHandler } from "../../../../../utils/asyncHandler.js";
import { sendSuccess, sendCreated } from "../../../../../utils/response.js";
import type { AuthenticatedRequest } from "../../../../../middlewares/auth.js";
import type { ReservationApplicationService } from "../../application/services/ReservationApplicationService.js";
import type { ReservationAvailabilityChecker } from "../../application/services/ReservationAvailabilityChecker.js";

export function createReservationController(
  service: ReservationApplicationService,
  checker: ReservationAvailabilityChecker,
) {
  return {
    create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { date, startTime, endTime, partySize, tableId, diningAreaId, tableTypeId } = req.body;

      await checker.checkBeforeCreate({
        restaurantId: req.params.id,
        date,
        startTime,
        endTime,
        partySize,
        tableId,
        diningAreaId,
        tableTypeId,
      });

      const result = await service.create(
        { restaurantId: req.params.id, ...req.body },
        req.authContext!,
        {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
        },
      );
      sendCreated(res, result, "Reservation created successfully");
    }),

    list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { status, date, customerId } = req.query as {
        status?: string;
        date?: string;
        customerId?: string;
      };
      const result = await service.list(
        { restaurantId: req.params.id, status, date, customerId },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),

    getById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.getById(
        { id: req.params.reservationId, restaurantId: req.params.id },
        req.authContext!,
      );
      sendSuccess(res, result);
    }),

    update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { date, startTime, endTime, partySize, tableId, diningAreaId, tableTypeId } = req.body;

      const getResult = await service.getById(
        { id: req.params.reservationId, restaurantId: req.params.id },
        req.authContext!,
      );

      await checker.checkBeforeUpdate({
        restaurantId: req.params.id,
        date,
        startTime,
        endTime,
        partySize,
        tableId,
        diningAreaId,
        tableTypeId,
        existingDate: getResult.date,
        existingStartTime: getResult.startTime,
        existingEndTime: getResult.endTime,
        existingPartySize: getResult.partySize,
      });

      const result = await service.update(
        { id: req.params.reservationId, restaurantId: req.params.id, ...req.body },
        req.authContext!,
        {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
        },
      );
      sendSuccess(res, result, undefined, "Reservation updated successfully");
    }),

    cancel: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.cancel(
        { id: req.params.reservationId, restaurantId: req.params.id },
        req.authContext!,
        {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
        },
      );
      sendSuccess(res, result, undefined, "Reservation cancelled successfully");
    }),

    confirm: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const getResult = await service.getById(
        { id: req.params.reservationId, restaurantId: req.params.id },
        req.authContext!,
      );

      await checker.checkBeforeConfirm({
        restaurantId: req.params.id,
        date: getResult.date,
        startTime: getResult.startTime,
        endTime: getResult.endTime,
        partySize: getResult.partySize,
      });

      const result = await service.confirm(
        { id: req.params.reservationId, restaurantId: req.params.id },
        req.authContext!,
        {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
        },
      );
      sendSuccess(res, result, undefined, "Reservation confirmed successfully");
    }),

    checkIn: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.checkIn(
        { id: req.params.reservationId, restaurantId: req.params.id },
        req.authContext!,
        {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
        },
      );
      sendSuccess(res, result, undefined, "Reservation checked in successfully");
    }),

    complete: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.complete(
        { id: req.params.reservationId, restaurantId: req.params.id },
        req.authContext!,
        {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
        },
      );
      sendSuccess(res, result, undefined, "Reservation completed successfully");
    }),
  };
}
