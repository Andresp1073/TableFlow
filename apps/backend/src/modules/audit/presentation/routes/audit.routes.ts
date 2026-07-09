import { Router } from "express";
import { requireAuth } from "../../../../middlewares/auth.js";
import { requirePermission } from "../../../authorization/middleware/guards.js";
import { enrichContext } from "../../../authorization/middleware/enrichContext.js";
import { validate } from "../../../../middlewares/validate.js";
import { prisma } from "../../../../config/database.js";
import { eventBus } from "../../../../events/EventBus.js";
import { ConcreteAuditFactory, PrismaAuditRepository } from "../../infrastructure/repositories/index.js";
import { AuditApplicationService } from "../../application/services/AuditApplicationService.js";
import { createAuditController } from "../controllers/AuditController.js";
import {
  auditEntryIdParamsSchema,
  listAuditEntriesQuerySchema,
} from "../validation/audit.validation.js";

const factory = new ConcreteAuditFactory();
const repository = new PrismaAuditRepository(prisma, factory);
const applicationService = new AuditApplicationService(repository, factory, eventBus);

const controller = createAuditController(applicationService);

const router = Router();

router.get(
  "/",
  requireAuth,
  enrichContext(),
  requirePermission("audit.read"),
  validate(listAuditEntriesQuerySchema),
  controller.list,
);

router.get(
  "/:id",
  requireAuth,
  enrichContext(),
  requirePermission("audit.read"),
  validate(auditEntryIdParamsSchema),
  controller.getById,
);

export default router;
