import { z } from "zod";
import { ASSET_TYPES } from "../../domain/models/AssetType.js";

export const assetParamsSchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
  }),
};

export const assetIdParamsSchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
    assetId: z.string().uuid("Asset ID must be a valid UUID"),
  }),
};

export const uploadAssetSchema = {
  body: z.object({
    type: z.enum(ASSET_TYPES as never as [string, ...string[]], {
      errorMap: () => ({ message: `Invalid asset type. Allowed: ${ASSET_TYPES.join(", ")}` }),
    }),
    name: z.string().min(1).max(255).optional(),
    isPrimary: z.union([z.boolean(), z.string()]).optional(),
  }),
};

export const listAssetsQuerySchema = {
  query: z.object({
    type: z.enum(ASSET_TYPES as never as [string, ...string[]]).optional(),
  }),
};

export const replacePrimarySchema = {
  params: z.object({
    id: z.string().uuid("Restaurant ID must be a valid UUID"),
    assetId: z.string().uuid("Asset ID must be a valid UUID"),
  }),
};
