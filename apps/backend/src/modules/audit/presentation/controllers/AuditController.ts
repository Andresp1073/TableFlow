import type { Response } from "express";
import { asyncHandler } from "../../../../utils/asyncHandler.js";
import { sendSuccess, buildPaginationMeta } from "../../../../utils/response.js";
import type { AuthenticatedRequest } from "../../../../middlewares/auth.js";
import type { AuditApplicationService } from "../../application/services/AuditApplicationService.js";

export function createAuditController(service: AuditApplicationService) {
  return {
    list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const {
        module,
        entityType,
        entityId,
        action,
        performedBy,
        restaurantId,
        startDate,
        endDate,
        page,
        limit,
      } = req.query as {
        module?: string;
        entityType?: string;
        entityId?: string;
        action?: string;
        performedBy?: string;
        restaurantId?: string;
        startDate?: string;
        endDate?: string;
        page?: string;
        limit?: string;
      };

      const result = await service.search({
        organizationId: req.organizationId!,
        module,
        entityType,
        entityId,
        action,
        performedBy,
        restaurantId,
        startDate,
        endDate,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      });

      sendSuccess(res, result.items, buildPaginationMeta(result.total, result.page, result.limit));
    }),

    getById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await service.getById({
        id: req.params.id,
        organizationId: req.organizationId!,
      });

      sendSuccess(res, result);
    }),
  };
}
