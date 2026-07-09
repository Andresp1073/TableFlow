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
import { ConcreteDiningAreaFactory, PrismaDiningAreaRepository } from "../../infrastructure/repositories/index.js";
import { DiningAreaApplicationService } from "../../application/services/DiningAreaApplicationService.js";
import { createDiningAreaController } from "../controllers/DiningAreaController.js";
import {
  diningAreaParamsSchema,
  diningAreaIdParamsSchema,
  createDiningAreaSchema,
  updateDiningAreaSchema,
  archiveDiningAreaSchema,
  listDiningAreasQuerySchema,
} from "../validation/dining-areas.validation.js";

const auditFactory = new ConcreteAuditFactory();
const auditRepository = new PrismaAuditRepository(prisma, auditFactory);
const auditService = new AuditApplicationService(auditRepository, auditFactory, eventBus);

const factory = new ConcreteDiningAreaFactory();
const repository = new PrismaDiningAreaRepository(prisma, factory);
const authService = new AuthorizationServiceImpl();

const applicationService = new DiningAreaApplicationService(
  repository,
  factory,
  authService,
  eventBus,
  auditService,
);

const controller = createDiningAreaController(applicationService);

const router = Router({ mergeParams: true });

router.get(
  "/dining-areas",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.dining-areas.read"),
  validate(diningAreaParamsSchema),
  validate(listDiningAreasQuerySchema),
  controller.list,
);

router.get(
  "/dining-areas/:diningAreaId",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.dining-areas.read"),
  validate(diningAreaIdParamsSchema),
  controller.getById,
);

router.post(
  "/dining-areas",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.dining-areas.create"),
  validate(diningAreaParamsSchema),
  validate(createDiningAreaSchema),
  controller.create,
);

router.put(
  "/dining-areas/:diningAreaId",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.dining-areas.update"),
  validate(diningAreaIdParamsSchema),
  validate(updateDiningAreaSchema),
  controller.update,
);

router.patch(
  "/dining-areas/:diningAreaId/archive",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.dining-areas.archive"),
  validate(archiveDiningAreaSchema),
  controller.archive,
);

export default router;
