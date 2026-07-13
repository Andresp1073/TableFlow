import { Router } from "express";
import { requireAuth } from "../../../../middlewares/auth.js";
import { requirePermission } from "../../../authorization/middleware/guards.js";
import { enrichContext } from "../../../authorization/middleware/enrichContext.js";
import { validate } from "../../../../middlewares/validate.js";
import { RestaurantApplicationService } from "../../application/services/RestaurantApplicationService.js";
import { PrismaRestaurantRepository, PrismaRestaurantQueryRepository, ConcreteRestaurantFactory } from "../../infrastructure/repositories/index.js";
import { RestaurantUniquenessValidator } from "../../domain/services/RestaurantUniquenessValidator.js";
import { RestaurantStatusPolicy } from "../../domain/rules/RestaurantStatusPolicy.js";
import { AuthorizationServiceImpl } from "../../../authorization/application/services/AuthorizationServiceImpl.js";
import { eventBus } from "../../../../events/EventBus.js";
import { prisma } from "../../../../config/database.js";
import { createRestaurantController } from "../controllers/RestaurantController.js";
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  restaurantIdParamSchema,
  listRestaurantsQuerySchema,
  archiveRestaurantSchema,
  activateRestaurantSchema,
  suspendRestaurantSchema,
} from "../validation/restaurant.validation.js";
import { restaurantSettingsRouter } from "../../settings/presentation/index.js";
import { reservationPolicyRouter } from "../../reservation-policy/presentation/index.js";
import { businessHoursRouter } from "../../business-hours/presentation/index.js";
import { calendarExceptionsRouter } from "../../calendar-exceptions/presentation/index.js";
import { configurationResolverRouter } from "../../configuration-resolver/presentation/index.js";
import { assetsRouter } from "../../assets/presentation/index.js";
import { diningAreasRouter } from "../../dining-areas/presentation/index.js";
import { tableTypesRouter } from "../../table-types/presentation/index.js";
import { tablesRouter, tablesAvailabilityRouter } from "../../tables/presentation/index.js";
import { tableGroupsRouter } from "../../table-groups/presentation/index.js";
import { reservationsRouter } from "../../reservations/presentation/index.js";

const repository = new PrismaRestaurantRepository(prisma);
const queryRepository = new PrismaRestaurantQueryRepository(prisma);
const factory = new ConcreteRestaurantFactory();
const uniquenessValidator = new RestaurantUniquenessValidator(repository);
const statusPolicy = new RestaurantStatusPolicy();
const authService = new AuthorizationServiceImpl();

const applicationService = new RestaurantApplicationService(
  repository,
  queryRepository,
  queryRepository,
  factory,
  uniquenessValidator,
  statusPolicy,
  authService,
  eventBus,
);

const controller = createRestaurantController(applicationService);

const router = Router();

router.post(
  "/",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.create"),
  validate(createRestaurantSchema),
  controller.create,
);

router.get(
  "/",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.read"),
  validate(listRestaurantsQuerySchema),
  controller.list,
);

router.get(
  "/:id",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.read"),
  validate(restaurantIdParamSchema),
  controller.getById,
);

router.put(
  "/:id",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.update"),
  validate(restaurantIdParamSchema),
  validate(updateRestaurantSchema),
  controller.update,
);

router.patch(
  "/:id/activate",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.activate"),
  validate(activateRestaurantSchema),
  controller.activate,
);

router.patch(
  "/:id/suspend",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.suspend"),
  validate(suspendRestaurantSchema),
  controller.suspend,
);

router.patch(
  "/:id/archive",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.archive"),
  validate(archiveRestaurantSchema),
  controller.archive,
);

router.use("/:id", restaurantSettingsRouter);
router.use("/:id", reservationPolicyRouter);
router.use("/:id", businessHoursRouter);
router.use("/:id", calendarExceptionsRouter);
router.use("/:id", configurationResolverRouter);
router.use("/:id", assetsRouter);
router.use("/:id", diningAreasRouter);
router.use("/:id", tableTypesRouter);
router.use("/:id", tablesRouter);
router.use("/:id", tablesAvailabilityRouter);
router.use("/:id", tableGroupsRouter);
router.use("/:id", reservationsRouter);

export default router;
