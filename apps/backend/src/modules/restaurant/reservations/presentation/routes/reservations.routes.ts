import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../../../../../middlewares/auth.js";
import { requirePermission } from "../../../../authorization/middleware/guards.js";
import { enrichContext } from "../../../../authorization/middleware/enrichContext.js";
import { validate } from "../../../../../middlewares/validate.js";
import { prisma } from "../../../../../config/database.js";
import { AuthorizationServiceImpl } from "../../../../authorization/application/services/AuthorizationServiceImpl.js";
import { eventBus } from "../../../../../events/EventBus.js";
import { AuditApplicationService } from "../../../../audit/application/services/AuditApplicationService.js";
import { ConcreteAuditFactory, PrismaAuditRepository } from "../../../../audit/infrastructure/repositories/index.js";
import { ConcreteReservationFactory } from "../../infrastructure/repositories/ConcreteReservationFactory.js";
import { PrismaReservationRepository } from "../../infrastructure/repositories/PrismaReservationRepository.js";
import { ReservationApplicationService } from "../../application/services/ReservationApplicationService.js";
import { ReservationAvailabilityChecker } from "../../application/services/ReservationAvailabilityChecker.js";
import { AvailabilityMapper } from "../../application/services/AvailabilityMapper.js";
import { TableAvailabilityAdapter } from "../../infrastructure/adapters/TableAvailabilityAdapter.js";
import { AvailabilityEngine } from "../../../tables/domain/services/availability/AvailabilityEngine.js";
import { RestaurantStatusEvaluator } from "../../../tables/domain/services/availability/evaluators/RestaurantStatusEvaluator.js";
import { BusinessHoursEvaluator } from "../../../tables/domain/services/availability/evaluators/BusinessHoursEvaluator.js";
import { CalendarExceptionEvaluator } from "../../../tables/domain/services/availability/evaluators/CalendarExceptionEvaluator.js";
import { TableGroupEvaluator } from "../../../tables/domain/services/availability/evaluators/TableGroupEvaluator.js";
import { TableActiveEvaluator } from "../../../tables/domain/services/availability/evaluators/TableActiveEvaluator.js";
import { DiningAreaEvaluator } from "../../../tables/domain/services/availability/evaluators/DiningAreaEvaluator.js";
import { TableTypeEvaluator } from "../../../tables/domain/services/availability/evaluators/TableTypeEvaluator.js";
import { TableStatusEvaluator } from "../../../tables/domain/services/availability/evaluators/TableStatusEvaluator.js";
import { ReservationPolicyEvaluator } from "../../../tables/domain/services/availability/evaluators/ReservationPolicyEvaluator.js";
import { FutureReservationEvaluator } from "../../../tables/domain/services/availability/evaluators/FutureReservationEvaluator.js";
import { createReservationController } from "../controllers/ReservationController.js";
import {
  reservationParamsSchema,
  reservationIdParamsSchema,
  createReservationSchema,
  updateReservationSchema,
  listReservationsQuerySchema,
} from "../validation/reservations.validation.js";

const auditFactory = new ConcreteAuditFactory();
const auditRepository = new PrismaAuditRepository(prisma, auditFactory);
const auditService = new AuditApplicationService(auditRepository, auditFactory, eventBus);

const reservationFactory = new ConcreteReservationFactory();
const reservationRepository = new PrismaReservationRepository(prisma, reservationFactory);

const authService = new AuthorizationServiceImpl();

const applicationService = new ReservationApplicationService(
  reservationRepository,
  reservationFactory,
  authService,
  eventBus,
  auditService,
);

const businessHoursRepo = {
  findByRestaurantId: (restaurantId: string) =>
    (prisma as PrismaClient).businessHours.findFirst({
      where: { restaurantId },
      include: { schedules: { include: { periods: true } } },
    }),
};

const calendarExceptionRepo = {
  findByRestaurantIdAndDate: (restaurantId: string, date: string) =>
    (prisma as PrismaClient).calendarException.findMany({
      where: { restaurantId, date },
    }),
};

const diningAreaRepo = {
  findByIdAndRestaurant: (id: string, restaurantId: string) =>
    (prisma as PrismaClient).diningArea.findFirst({ where: { id, restaurantId } }),
};

const tableTypeRepo = {
  findByIdAndRestaurant: (id: string, restaurantId: string) =>
    (prisma as PrismaClient).tableType.findFirst({ where: { id, restaurantId } }),
};

const reservationPolicyRepo = {
  findByRestaurantId: (restaurantId: string) =>
    (prisma as PrismaClient).reservationPolicy.findFirst({ where: { restaurantId } }),
};

const tableRepo = {
  findByIdAndRestaurant: (id: string, restaurantId: string) =>
    (prisma as PrismaClient).restaurantTable.findFirst({ where: { id, restaurantId } }),
};

const tableGroupRepo = {
  findActiveGroupByTableId: async (tableId: string) => {
    const member = await (prisma as PrismaClient).tableGroupMember.findFirst({
      where: { tableId },
      include: { tableGroup: true },
    });
    if (!member) return null;
    const status = member.tableGroup.status;
    if (!["active", "reserved", "occupied"].includes(status)) return null;
    return { id: member.tableGroup.id, status: { value: status } };
  },
};

const availabilityEngine = new AvailabilityEngine([
  new RestaurantStatusEvaluator(),
  new BusinessHoursEvaluator(businessHoursRepo),
  new CalendarExceptionEvaluator(calendarExceptionRepo),
  new TableGroupEvaluator(tableGroupRepo),
  new TableActiveEvaluator(tableRepo),
  new DiningAreaEvaluator(diningAreaRepo),
  new TableTypeEvaluator(tableTypeRepo),
  new TableStatusEvaluator(tableRepo),
  new ReservationPolicyEvaluator(reservationPolicyRepo),
  new FutureReservationEvaluator(),
]);

const availabilityAdapter = new TableAvailabilityAdapter(availabilityEngine);
const availabilityMapper = new AvailabilityMapper();
const availabilityChecker = new ReservationAvailabilityChecker(availabilityAdapter, availabilityMapper);

const controller = createReservationController(applicationService, availabilityChecker);

const router = Router({ mergeParams: true });

router.get(
  "/reservations",
  requireAuth,
  enrichContext(),
  requirePermission("reservations.read"),
  validate(reservationParamsSchema),
  validate(listReservationsQuerySchema),
  controller.list,
);

router.get(
  "/reservations/:reservationId",
  requireAuth,
  enrichContext(),
  requirePermission("reservations.read"),
  validate(reservationIdParamsSchema),
  controller.getById,
);

router.post(
  "/reservations",
  requireAuth,
  enrichContext(),
  requirePermission("reservations.create"),
  validate(reservationParamsSchema),
  validate(createReservationSchema),
  controller.create,
);

router.put(
  "/reservations/:reservationId",
  requireAuth,
  enrichContext(),
  requirePermission("reservations.update"),
  validate(reservationIdParamsSchema),
  validate(updateReservationSchema),
  controller.update,
);

router.patch(
  "/reservations/:reservationId/cancel",
  requireAuth,
  enrichContext(),
  requirePermission("reservations.cancel"),
  validate(reservationIdParamsSchema),
  controller.cancel,
);

router.patch(
  "/reservations/:reservationId/confirm",
  requireAuth,
  enrichContext(),
  requirePermission("reservations.confirm"),
  validate(reservationIdParamsSchema),
  controller.confirm,
);

router.patch(
  "/reservations/:reservationId/check-in",
  requireAuth,
  enrichContext(),
  requirePermission("reservations.checkIn"),
  validate(reservationIdParamsSchema),
  controller.checkIn,
);

router.patch(
  "/reservations/:reservationId/complete",
  requireAuth,
  enrichContext(),
  requirePermission("reservations.checkOut"),
  validate(reservationIdParamsSchema),
  controller.complete,
);

export default router;
