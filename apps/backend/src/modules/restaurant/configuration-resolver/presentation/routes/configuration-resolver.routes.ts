import { Router } from "express";
import { requireAuth } from "../../../../../middlewares/auth.js";
import { requirePermission } from "../../../../authorization/middleware/guards.js";
import { enrichContext } from "../../../../authorization/middleware/enrichContext.js";
import { prisma } from "../../../../../config/database.js";
import { AuthorizationServiceImpl } from "../../../../authorization/application/services/AuthorizationServiceImpl.js";
import { PrismaRestaurantRepository } from "../../../infrastructure/repositories/PrismaRestaurantRepository.js";
import { PrismaRestaurantSettingsRepository } from "../../../settings/infrastructure/repositories/PrismaRestaurantSettingsRepository.js";
import { ConcreteRestaurantSettingsFactory } from "../../../settings/infrastructure/repositories/ConcreteRestaurantSettingsFactory.js";
import { PrismaReservationPolicyRepository } from "../../../reservation-policy/infrastructure/repositories/PrismaReservationPolicyRepository.js";
import { ConcreteReservationPolicyFactory } from "../../../reservation-policy/infrastructure/repositories/ConcreteReservationPolicyFactory.js";
import { PrismaBusinessHoursRepository } from "../../../business-hours/infrastructure/repositories/PrismaBusinessHoursRepository.js";
import { ConcreteBusinessHoursFactory } from "../../../business-hours/infrastructure/repositories/ConcreteBusinessHoursFactory.js";
import { PrismaCalendarExceptionRepository } from "../../../calendar-exceptions/infrastructure/repositories/PrismaCalendarExceptionRepository.js";
import { ConcreteCalendarExceptionFactory } from "../../../calendar-exceptions/infrastructure/repositories/ConcreteCalendarExceptionFactory.js";
import { MemoryCacheProvider } from "../../../../../shared/cache/application/MemoryCacheProvider.js";
import { RestaurantConfigurationService } from "../../application/services/RestaurantConfigurationService.js";
import { createRestaurantConfigurationController } from "../controllers/RestaurantConfigurationController.js";

const restaurantRepository = new PrismaRestaurantRepository(prisma);
const settingsFactory = new ConcreteRestaurantSettingsFactory();
const settingsRepository = new PrismaRestaurantSettingsRepository(prisma, settingsFactory);
const policyFactory = new ConcreteReservationPolicyFactory();
const policyRepository = new PrismaReservationPolicyRepository(prisma, policyFactory);
const businessHoursFactory = new ConcreteBusinessHoursFactory();
const businessHoursRepository = new PrismaBusinessHoursRepository(prisma, businessHoursFactory);
const calendarExceptionFactory = new ConcreteCalendarExceptionFactory();
const calendarExceptionRepository = new PrismaCalendarExceptionRepository(prisma, calendarExceptionFactory);
const authService = new AuthorizationServiceImpl();
const cache = new MemoryCacheProvider();

const applicationService = new RestaurantConfigurationService(
  restaurantRepository,
  settingsRepository,
  policyRepository,
  businessHoursRepository,
  calendarExceptionRepository,
  authService,
  cache,
);

const controller = createRestaurantConfigurationController(applicationService);

const router = Router({ mergeParams: true });

router.get(
  "/configuration",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.read"),
  controller.get,
);

router.post(
  "/configuration/refresh",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.read"),
  controller.refresh,
);

export default router;
