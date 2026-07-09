import { Router } from "express";
import { requireAuth } from "../../../../../middlewares/auth.js";
import { requirePermission } from "../../../../authorization/middleware/guards.js";
import { enrichContext } from "../../../../authorization/middleware/enrichContext.js";
import { validate } from "../../../../../middlewares/validate.js";
import { PrismaBusinessHoursRepository, ConcreteBusinessHoursFactory } from "../../infrastructure/repositories/index.js";
import { BusinessHoursApplicationService } from "../../application/services/BusinessHoursApplicationService.js";
import { AuthorizationServiceImpl } from "../../../../authorization/application/services/AuthorizationServiceImpl.js";
import { eventBus } from "../../../../../events/EventBus.js";
import { prisma } from "../../../../../config/database.js";
import { createBusinessHoursController } from "../controllers/BusinessHoursController.js";
import {
  businessHoursParamsSchema,
  updateBusinessHoursSchema,
} from "../validation/business-hours.validation.js";

const factory = new ConcreteBusinessHoursFactory();
const repository = new PrismaBusinessHoursRepository(prisma, factory);
const authService = new AuthorizationServiceImpl();

const applicationService = new BusinessHoursApplicationService(
  repository,
  factory,
  authService,
  eventBus,
);

const controller = createBusinessHoursController(applicationService);

const router = Router({ mergeParams: true });

router.get(
  "/business-hours",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.business-hours.read"),
  validate(businessHoursParamsSchema),
  controller.getOrCreate,
);

router.put(
  "/business-hours",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.business-hours.update"),
  validate(businessHoursParamsSchema),
  validate(updateBusinessHoursSchema),
  controller.update,
);

export default router;
