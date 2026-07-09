import type { Response } from "express";
import type { AuthenticatedRequest } from "../../../../../middlewares/auth.js";
import { asyncHandler } from "../../../../../utils/asyncHandler.js";
import { sendSuccess, sendCreated, sendNoContent } from "../../../../../utils/response.js";
import type { AssetApplicationService } from "../../application/services/AssetApplicationService.js";

export function createAssetController(service: AssetApplicationService) {
  return {
    upload: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, error: { message: "File is required" } });
        return;
      }

      const result = await service.upload(
        {
          restaurantId: req.params.id,
          type: req.body.type,
          name: req.body.name || file.originalname,
          fileBuffer: file.buffer,
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          isPrimary: req.body.isPrimary === true || req.body.isPrimary === "true",
        },
        req.authContext!,
      );

      sendCreated(res, result, "Asset uploaded successfully");
    }),

    list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.list(
        {
          restaurantId: req.params.id,
          type: req.query.type as string | undefined,
        },
        req.authContext!,
      );

      sendSuccess(res, result);
    }),

    get: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.get(
        {
          restaurantId: req.params.id,
          id: req.params.assetId,
        },
        req.authContext!,
      );

      sendSuccess(res, result);
    }),

    delete: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      await service.delete(
        {
          restaurantId: req.params.id,
          id: req.params.assetId,
        },
        req.authContext!,
      );

      sendNoContent(res);
    }),

    replacePrimary: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.replacePrimary(
        {
          restaurantId: req.params.id,
          id: req.params.assetId,
        },
        req.authContext!,
      );

      sendSuccess(res, result, undefined, "Primary asset updated successfully");
    }),
  };
}
