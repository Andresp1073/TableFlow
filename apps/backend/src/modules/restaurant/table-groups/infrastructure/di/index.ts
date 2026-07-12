import type { PrismaClient } from "@prisma/client";
import type { AuthorizationService } from "../../../authorization/application/services/AuthorizationService.js";
import type { AuditService } from "../../../audit/application/services/AuditService.js";
import type { TableGroupCacheInvalidator } from "../../application/services/TableGroupCacheInvalidator.js";
import { EventBus } from "../../../../events/EventBus.js";
import { ConcreteTableGroupFactory } from "../repositories/ConcreteTableGroupFactory.js";
import { PrismaTableGroupRepository } from "../repositories/PrismaTableGroupRepository.js";
import { TableGroupApplicationService } from "../../application/services/TableGroupApplicationService.js";

export interface TableGroupModuleDependencies {
  prisma: PrismaClient;
  authService: AuthorizationService;
  eventBus: EventBus;
  auditService: AuditService;
  cacheInvalidator?: TableGroupCacheInvalidator;
}

export function createTableGroupRepository(prisma: PrismaClient): PrismaTableGroupRepository {
  const factory = new ConcreteTableGroupFactory();
  return new PrismaTableGroupRepository(prisma, factory);
}

export function createTableGroupApplicationService(
  deps: TableGroupModuleDependencies,
): TableGroupApplicationService {
  const factory = new ConcreteTableGroupFactory();
  const groupRepository = new PrismaTableGroupRepository(deps.prisma, factory);

  const tableRepository = {
    findByIdAndRestaurant: async (id: string, restaurantId: string) => {
      const table = await deps.prisma.restaurantTable.findUnique({ where: { id } });
      if (!table || table.restaurantId !== restaurantId) return null;
      return {
        id: table.id,
        restaurantId: table.restaurantId,
        status: { value: table.status },
        maximumCapacity: { value: table.maxCapacity },
      };
    },
  };

  return new TableGroupApplicationService(
    groupRepository,
    factory,
    tableRepository,
    deps.authService,
    deps.eventBus,
    deps.auditService,
    deps.cacheInvalidator,
  );
}
