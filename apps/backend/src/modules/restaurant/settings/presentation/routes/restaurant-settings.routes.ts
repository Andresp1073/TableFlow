import { Router } from "express";
import { requireAuth } from "../../../../../middlewares/auth.js";
import { requirePermission } from "../../../../authorization/middleware/guards.js";
import { enrichContext } from "../../../../authorization/middleware/enrichContext.js";
import { validate } from "../../../../../middlewares/validate.js";
import { PrismaRestaurantSettingsRepository, ConcreteRestaurantSettingsFactory } from "../../infrastructure/repositories/index.js";
import { RestaurantSettingsApplicationService } from "../../application/services/RestaurantSettingsApplicationService.js";
import { AuthorizationServiceImpl } from "../../../../authorization/application/services/AuthorizationServiceImpl.js";
import { eventBus } from "../../../../../events/EventBus.js";
import { prisma } from "../../../../../config/database.js";
import { createRestaurantSettingsController } from "../controllers/RestaurantSettingsController.js";
import {
  restaurantSettingsParamsSchema,
  updateRestaurantSettingsSchema,
} from "../validation/restaurant-settings.validation.js";

const factory = new ConcreteRestaurantSettingsFactory();
const repository = new PrismaRestaurantSettingsRepository(prisma, factory);
const authService = new AuthorizationServiceImpl();

const applicationService = new RestaurantSettingsApplicationService(
  repository,
  factory,
  authService,
  eventBus,
);

const controller = createRestaurantSettingsController(applicationService);

const router = Router({ mergeParams: true });

router.get(
  "/settings",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.settings.read"),
  validate(restaurantSettingsParamsSchema),
  controller.getOrCreate,
);

router.put(
  "/settings",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.settings.update"),
  validate(restaurantSettingsParamsSchema),
  validate(updateRestaurantSettingsSchema),
  controller.update,
);

export default router;
