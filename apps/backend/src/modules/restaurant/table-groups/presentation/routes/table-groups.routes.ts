import { Router } from "express";
import { requireAuth } from "../../../../../middlewares/auth.js";
import { requirePermission } from "../../../../authorization/middleware/guards.js";
import { enrichContext } from "../../../../authorization/middleware/enrichContext.js";
import { validate } from "../../../../../middlewares/validate.js";
import { prisma } from "../../../../../config/database.js";
import { AuthorizationServiceImpl } from "../../../../authorization/application/services/AuthorizationServiceImpl.js";
import { eventBus } from "../../../../../events/EventBus.js";
import { AuditApplicationService } from "../../../../audit/application/services/AuditApplicationService.js";
import { ConcreteAuditFactory, PrismaAuditRepository } from "../../../../audit/infrastructure/repositories/index.js";
import { ConcreteTableGroupFactory, PrismaTableGroupRepository } from "../../infrastructure/repositories/index.js";
import { TableGroupApplicationService } from "../../application/services/TableGroupApplicationService.js";
import { createTableGroupController } from "../controllers/TableGroupController.js";
import {
  tableParamsSchema,
  tableGroupIdParamsSchema,
  createTableGroupSchema,
  updateTableGroupSchema,
  listTableGroupsQuerySchema,
} from "../validation/table-groups.validation.js";

const auditFactory = new ConcreteAuditFactory();
const auditRepository = new PrismaAuditRepository(prisma, auditFactory);
const auditService = new AuditApplicationService(auditRepository, auditFactory, eventBus);

const groupFactory = new ConcreteTableGroupFactory();
const groupRepository = new PrismaTableGroupRepository(prisma, groupFactory);

const tableRepository = {
  findByIdAndRestaurant: async (id: string, restaurantId: string) => {
    const table = await prisma.restaurantTable.findUnique({ where: { id } });
    if (!table || table.restaurantId !== restaurantId) return null;
    return {
      id: table.id,
      restaurantId: table.restaurantId,
      status: { value: table.status },
      maximumCapacity: { value: table.maxCapacity },
    };
  },
};

const authService = new AuthorizationServiceImpl();

const applicationService = new TableGroupApplicationService(
  groupRepository,
  groupFactory,
  tableRepository,
  authService,
  eventBus,
  auditService,
);

const controller = createTableGroupController(applicationService);

const router = Router({ mergeParams: true });

router.get(
  "/table-groups",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.table-groups.read"),
  validate(tableParamsSchema),
  validate(listTableGroupsQuerySchema),
  controller.list,
);

router.get(
  "/table-groups/:groupId",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.table-groups.read"),
  validate(tableGroupIdParamsSchema),
  controller.getById,
);

router.post(
  "/table-groups",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.table-groups.create"),
  validate(tableParamsSchema),
  validate(createTableGroupSchema),
  controller.create,
);

router.put(
  "/table-groups/:groupId",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.table-groups.update"),
  validate(tableGroupIdParamsSchema),
  validate(updateTableGroupSchema),
  controller.update,
);

router.patch(
  "/table-groups/:groupId/release",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.table-groups.release"),
  validate(tableGroupIdParamsSchema),
  controller.release,
);

export default router;
