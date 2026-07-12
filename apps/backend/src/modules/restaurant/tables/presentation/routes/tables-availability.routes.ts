import { Router } from "express";
import { requireAuth } from "../../../../../middlewares/auth.js";
import { requirePermission } from "../../../../authorization/middleware/guards.js";
import { enrichContext } from "../../../../authorization/middleware/enrichContext.js";
import { validate } from "../../../../../middlewares/validate.js";
import { prisma } from "../../../../../config/database.js";
import { AuthorizationServiceImpl } from "../../../../authorization/application/services/AuthorizationServiceImpl.js";
import { eventBus } from "../../../../../events/EventBus.js";
import { ConcreteTableFactory, PrismaTableRepository } from "../../infrastructure/repositories/index.js";
import { TableAvailabilityService } from "../../application/services/TableAvailabilityService.js";
import { TableAvailabilityCacheService } from "../../application/services/TableAvailabilityCacheService.js";
import { createTableAvailabilityController } from "../controllers/TableAvailabilityController.js";
import {
  checkAvailabilityParamsSchema,
  listAvailableTablesQuerySchema,
} from "../validation/tables-availability.validation.js";
import { MemoryCacheProvider } from "../../../../../shared/cache/application/MemoryCacheProvider.js";

const factory = new ConcreteTableFactory();
const tableRepository = new PrismaTableRepository(prisma, factory);
const authService = new AuthorizationServiceImpl();

const businessHoursRepo = {
  findByRestaurantId: (restaurantId: string) =>
    prisma.businessHours.findFirst({
      where: { restaurantId },
      include: { schedules: { include: { periods: true } } },
    }),
};

const calendarExceptionRepo = {
  findByRestaurantIdAndDate: (restaurantId: string, date: string) =>
    prisma.calendarException.findMany({
      where: { restaurantId, date },
    }),
};

const diningAreaRepo = {
  findByIdAndRestaurant: (id: string, restaurantId: string) =>
    prisma.diningArea.findFirst({ where: { id, restaurantId } }),
};

const tableTypeRepo = {
  findByIdAndRestaurant: (id: string, restaurantId: string) =>
    prisma.tableType.findFirst({ where: { id, restaurantId } }),
};

const reservationPolicyRepo = {
  findByRestaurantId: (restaurantId: string) =>
    prisma.reservationPolicy.findFirst({ where: { restaurantId } }),
};

const cacheProvider = new MemoryCacheProvider();
const cacheService = new TableAvailabilityCacheService(cacheProvider);

const tableGroupRepo = {
  findActiveGroupByTableId: async (tableId: string) => {
    const member = await prisma.tableGroupMember.findFirst({
      where: { tableId },
      include: { tableGroup: true },
    });
    if (!member) return null;
    const status = member.tableGroup.status;
    if (!["active", "reserved", "occupied"].includes(status)) return null;
    return { id: member.tableGroup.id, status: { value: status } };
  },
};

const availabilityService = new TableAvailabilityService(
  tableRepository,
  businessHoursRepo,
  calendarExceptionRepo,
  diningAreaRepo,
  tableTypeRepo,
  reservationPolicyRepo,
  authService,
  cacheService,
  tableGroupRepo,
);

const controller = createTableAvailabilityController(availabilityService);

const router = Router({ mergeParams: true });

router.get(
  "/tables/availability",
  requireAuth,
  enrichContext(),
  requirePermission("tables.read"),
  validate(listAvailableTablesQuerySchema),
  controller.listAvailableTables,
);

router.get(
  "/tables/:tableId/availability",
  requireAuth,
  enrichContext(),
  requirePermission("tables.read"),
  validate(checkAvailabilityParamsSchema),
  controller.checkAvailability,
);

export default router;
