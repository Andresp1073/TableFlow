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
import { ConcreteTableTypeFactory, PrismaTableTypeRepository } from "../../infrastructure/repositories/index.js";
import { TableTypeApplicationService } from "../../application/services/TableTypeApplicationService.js";
import { createTableTypeController } from "../controllers/TableTypeController.js";
import {
  tableTypeParamsSchema,
  tableTypeIdParamsSchema,
  createTableTypeSchema,
  updateTableTypeSchema,
  archiveTableTypeSchema,
  listTableTypesQuerySchema,
} from "../validation/table-types.validation.js";

const auditFactory = new ConcreteAuditFactory();
const auditRepository = new PrismaAuditRepository(prisma, auditFactory);
const auditService = new AuditApplicationService(auditRepository, auditFactory, eventBus);

const factory = new ConcreteTableTypeFactory();
const repository = new PrismaTableTypeRepository(prisma, factory);
const authService = new AuthorizationServiceImpl();

const applicationService = new TableTypeApplicationService(
  repository,
  factory,
  authService,
  eventBus,
  auditService,
);

const controller = createTableTypeController(applicationService);

const router = Router({ mergeParams: true });

router.get(
  "/table-types",
  requireAuth,
  enrichContext(),
  requirePermission("table-types.read"),
  validate(tableTypeParamsSchema),
  validate(listTableTypesQuerySchema),
  controller.list,
);

router.get(
  "/table-types/:tableTypeId",
  requireAuth,
  enrichContext(),
  requirePermission("table-types.read"),
  validate(tableTypeIdParamsSchema),
  controller.getById,
);

router.post(
  "/table-types",
  requireAuth,
  enrichContext(),
  requirePermission("table-types.create"),
  validate(tableTypeParamsSchema),
  validate(createTableTypeSchema),
  controller.create,
);

router.put(
  "/table-types/:tableTypeId",
  requireAuth,
  enrichContext(),
  requirePermission("table-types.update"),
  validate(tableTypeIdParamsSchema),
  validate(updateTableTypeSchema),
  controller.update,
);

router.patch(
  "/table-types/:tableTypeId/archive",
  requireAuth,
  enrichContext(),
  requirePermission("table-types.archive"),
  validate(archiveTableTypeSchema),
  controller.archive,
);

export default router;
