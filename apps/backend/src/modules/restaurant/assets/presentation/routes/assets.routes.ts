import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../../../../middlewares/auth.js";
import { requirePermission } from "../../../../authorization/middleware/guards.js";
import { enrichContext } from "../../../../authorization/middleware/enrichContext.js";
import { validate } from "../../../../../middlewares/validate.js";
import { prisma } from "../../../../../config/database.js";
import { AuthorizationServiceImpl } from "../../../../authorization/application/services/AuthorizationServiceImpl.js";
import { eventBus } from "../../../../../events/EventBus.js";
import { ConcreteAssetFactory, PrismaAssetRepository } from "../../infrastructure/repositories/index.js";
import { LocalStorageProvider } from "../../infrastructure/storage/LocalStorageProvider.js";
import { AssetApplicationService } from "../../application/services/AssetApplicationService.js";
import { createAssetController } from "../controllers/AssetController.js";
import {
  assetParamsSchema,
  assetIdParamsSchema,
  uploadAssetSchema,
  listAssetsQuerySchema,
  replacePrimarySchema,
} from "../validation/assets.validation.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

const factory = new ConcreteAssetFactory();
const repository = new PrismaAssetRepository(prisma, factory);
const storageProvider = new LocalStorageProvider();
const authService = new AuthorizationServiceImpl();

const applicationService = new AssetApplicationService(
  repository,
  factory,
  storageProvider,
  authService,
  eventBus,
);

const controller = createAssetController(applicationService);

const router = Router({ mergeParams: true });

router.get(
  "/assets",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.assets.read"),
  validate(assetParamsSchema),
  validate(listAssetsQuerySchema),
  controller.list,
);

router.get(
  "/assets/:assetId",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.assets.read"),
  validate(assetIdParamsSchema),
  controller.get,
);

router.post(
  "/assets",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.assets.upload"),
  validate(assetParamsSchema),
  upload.single("file"),
  validate(uploadAssetSchema),
  controller.upload,
);

router.delete(
  "/assets/:assetId",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.assets.delete"),
  validate(assetIdParamsSchema),
  controller.delete,
);

router.patch(
  "/assets/:assetId/primary",
  requireAuth,
  enrichContext(),
  requirePermission("restaurants.assets.update"),
  validate(replacePrimarySchema),
  controller.replacePrimary,
);

export default router;
