import type { PrismaClient } from "@prisma/client";
import type { AuthorizationService } from "../../../../authorization/application/services/AuthorizationService.js";
import type { AuditService } from "../../../../audit/application/services/AuditService.js";
import type { ReservationCacheInvalidator } from "../../application/services/ReservationCacheInvalidator.js";
import type { AvailabilityService } from "../../application/ports/AvailabilityService.js";
import { EventBus } from "../../../../../events/EventBus.js";
import { ConcreteReservationFactory } from "../repositories/ConcreteReservationFactory.js";
import { PrismaReservationRepository } from "../repositories/PrismaReservationRepository.js";
import { ReservationApplicationService } from "../../application/services/ReservationApplicationService.js";
import { ReservationAvailabilityChecker } from "../../application/services/ReservationAvailabilityChecker.js";
import { AvailabilityMapper } from "../../application/services/AvailabilityMapper.js";
import { CustomerDuplicatePolicy } from "../../../customers/domain/services/CustomerDuplicatePolicy.js";
import type { CustomerRepository } from "../../../customers/domain/repositories/CustomerRepository.js";

export interface ReservationModuleDependencies {
  prisma: PrismaClient;
  authService: AuthorizationService;
  eventBus: EventBus;
  auditService: AuditService;
  availabilityService: AvailabilityService;
  customerRepository?: CustomerRepository;
  cacheInvalidator?: ReservationCacheInvalidator;
}

export function createReservationRepository(prisma: PrismaClient): PrismaReservationRepository {
  const factory = new ConcreteReservationFactory();
  return new PrismaReservationRepository(prisma, factory);
}

export function createReservationApplicationService(
  deps: ReservationModuleDependencies,
): ReservationApplicationService {
  const factory = new ConcreteReservationFactory();
  const reservationRepository = new PrismaReservationRepository(deps.prisma, factory);

  return new ReservationApplicationService(
    reservationRepository,
    factory,
    deps.authService,
    deps.eventBus,
    deps.auditService,
    deps.cacheInvalidator,
  );
}

export function createReservationAvailabilityChecker(
  deps: ReservationModuleDependencies,
): ReservationAvailabilityChecker {
  const mapper = new AvailabilityMapper();
  return new ReservationAvailabilityChecker(deps.availabilityService, mapper);
}
