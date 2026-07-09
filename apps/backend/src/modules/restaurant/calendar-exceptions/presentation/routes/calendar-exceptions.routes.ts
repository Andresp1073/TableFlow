import { Router } from "express";
import { requireAuth } from "../../../../../middlewares/auth.js";
import { requirePermission } from "../../../../authorization/middleware/guards.js";
import { enrichContext } from "../../../../authorization/middleware/enrichContext.js";
import { validate } from "../../../../../middlewares/validate.js";
import { PrismaCalendarExceptionRepository, ConcreteCalendarExceptionFactory } from "../../infrastructure/repositories/index.js";
import { CalendarExceptionApplicationService } from "../../application/services/CalendarExceptionApplicationService.js";
import { AuthorizationServiceImpl } from "../../../../authorization/application/services/AuthorizationServiceImpl.js";
import { eventBus } from "../../../../../events/EventBus.js";
import { prisma } from "../../../../../config/database.js";
import { createCalendarExceptionController } from "../controllers/CalendarExceptionController.js";
import {
  calendarExceptionParamsSchema,
  calendarExceptionIdParamsSchema,
  createCalendarExceptionSchema,
  updateCalendarExceptionSchema,
  listCalendarExceptionsQuerySchema,
} from "../validation/calendar-exceptions.validation.js";

const factory = new ConcreteCalendarExceptionFactory();
const repository = new PrismaCalendarExceptionRepository(prisma, factory);
const authService = new AuthorizationServiceImpl();

const applicationService = new CalendarExceptionApplicationService(
  repository,
  factory,
  authService,
  eventBus,
);

const controller = createCalendarExceptionController(applicationService);

const router = Router({ mergeParams: true });

router.get(
  "/calendar-exceptions",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.calendar-exceptions.read"),
  validate(calendarExceptionParamsSchema),
  validate(listCalendarExceptionsQuerySchema),
  controller.list,
);

router.post(
  "/calendar-exceptions",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.calendar-exceptions.create"),
  validate(calendarExceptionParamsSchema),
  validate(createCalendarExceptionSchema),
  controller.create,
);

router.put(
  "/calendar-exceptions/:exceptionId",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.calendar-exceptions.update"),
  validate(calendarExceptionIdParamsSchema),
  validate(updateCalendarExceptionSchema),
  controller.update,
);

router.delete(
  "/calendar-exceptions/:exceptionId",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.calendar-exceptions.delete"),
  validate(calendarExceptionIdParamsSchema),
  controller.delete,
);

export default router;
