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
import { ConcreteTableFactory, PrismaTableRepository } from "../../infrastructure/repositories/index.js";
import { TableApplicationService } from "../../application/services/TableApplicationService.js";
import { createTableController } from "../controllers/TableController.js";
import {
  tableParamsSchema,
  tableIdParamsSchema,
  createTableSchema,
  updateTableSchema,
  archiveTableSchema,
  changeTableStatusSchema,
  listTablesQuerySchema,
} from "../validation/tables.validation.js";

const auditFactory = new ConcreteAuditFactory();
const auditRepository = new PrismaAuditRepository(prisma, auditFactory);
const auditService = new AuditApplicationService(auditRepository, auditFactory, eventBus);

const factory = new ConcreteTableFactory();
const repository = new PrismaTableRepository(prisma, factory);
const authService = new AuthorizationServiceImpl();

const applicationService = new TableApplicationService(
  repository,
  factory,
  authService,
  eventBus,
  auditService,
);

const controller = createTableController(applicationService);

const router = Router({ mergeParams: true });

router.get(
  "/tables",
  requireAuth,
  enrichContext(),
  requirePermission("tables.read"),
  validate(tableParamsSchema),
  validate(listTablesQuerySchema),
  controller.list,
);

router.get(
  "/tables/:tableId",
  requireAuth,
  enrichContext(),
  requirePermission("tables.read"),
  validate(tableIdParamsSchema),
  controller.getById,
);

router.post(
  "/tables",
  requireAuth,
  enrichContext(),
  requirePermission("tables.create"),
  validate(tableParamsSchema),
  validate(createTableSchema),
  controller.create,
);

router.put(
  "/tables/:tableId",
  requireAuth,
  enrichContext(),
  requirePermission("tables.update"),
  validate(tableIdParamsSchema),
  validate(updateTableSchema),
  controller.update,
);

router.patch(
  "/tables/:tableId/archive",
  requireAuth,
  enrichContext(),
  requirePermission("tables.archive"),
  validate(archiveTableSchema),
  controller.archive,
);

router.patch(
  "/tables/:tableId/status",
  requireAuth,
  enrichContext(),
  requirePermission("tables.status.update"),
  validate(changeTableStatusSchema),
  controller.changeStatus,
);

router.get(
  "/tables/:tableId/transitions",
  requireAuth,
  enrichContext(),
  requirePermission("tables.read"),
  validate(tableIdParamsSchema),
  controller.getTransitions,
);

export default router;
