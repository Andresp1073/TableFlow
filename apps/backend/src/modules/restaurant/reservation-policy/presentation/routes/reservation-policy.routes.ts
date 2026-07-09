import { Router } from "express";
import { requireAuth } from "../../../../../middlewares/auth.js";
import { requirePermission } from "../../../../authorization/middleware/guards.js";
import { enrichContext } from "../../../../authorization/middleware/enrichContext.js";
import { validate } from "../../../../../middlewares/validate.js";
import { PrismaReservationPolicyRepository, ConcreteReservationPolicyFactory } from "../../infrastructure/repositories/index.js";
import { ReservationPolicyApplicationService } from "../../application/services/ReservationPolicyApplicationService.js";
import { AuthorizationServiceImpl } from "../../../../authorization/application/services/AuthorizationServiceImpl.js";
import { eventBus } from "../../../../../events/EventBus.js";
import { prisma } from "../../../../../config/database.js";
import { createReservationPolicyController } from "../controllers/ReservationPolicyController.js";
import {
  reservationPolicyParamsSchema,
  updateReservationPolicySchema,
} from "../validation/reservation-policy.validation.js";

const factory = new ConcreteReservationPolicyFactory();
const repository = new PrismaReservationPolicyRepository(prisma, factory);
const authService = new AuthorizationServiceImpl();

const applicationService = new ReservationPolicyApplicationService(
  repository,
  factory,
  authService,
  eventBus,
);

const controller = createReservationPolicyController(applicationService);

const router = Router({ mergeParams: true });

router.get(
  "/reservation-policy",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.reservation-policy.read"),
  validate(reservationPolicyParamsSchema),
  controller.getOrCreate,
);

router.put(
  "/reservation-policy",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.reservation-policy.update"),
  validate(reservationPolicyParamsSchema),
  validate(updateReservationPolicySchema),
  controller.update,
);

export default router;
