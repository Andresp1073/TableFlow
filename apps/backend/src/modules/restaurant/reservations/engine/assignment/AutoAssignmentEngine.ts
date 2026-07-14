import type { AvailabilityService } from "../../application/ports/AvailabilityService.js";
import type { TableRepository } from "../../../tables/domain/repositories/TableRepository.js";
import type { TableGroupRepository } from "../../../table-groups/domain/repositories/TableGroupRepository.js";
import type { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import type { AssignmentContext, AssignmentCandidate, ScoringFactors } from "./types.js";
import type { AssignmentResult } from "./AssignmentResult.js";
import type { AssignmentStrategy } from "./AssignmentStrategy.js";
import { AssignmentCandidateGenerator } from "./AssignmentCandidateGenerator.js";
import { AssignmentScoringEngine } from "./AssignmentScoringEngine.js";
import { DefaultAssignmentStrategy } from "./AssignmentStrategy.js";
import { AssignmentCoordinator } from "./AssignmentCoordinator.js";

export interface AutoAssignmentEngineDependencies {
  availabilityService: AvailabilityService;
  tableRepository: TableRepository;
  tableGroupRepository: TableGroupRepository;
  reservationRepository: ReservationRepository;
}

export class AutoAssignmentEngine {
  private readonly candidateGenerator: AssignmentCandidateGenerator;
  private readonly scoringEngine: AssignmentScoringEngine;
  private readonly defaultStrategy: DefaultAssignmentStrategy;
  private readonly coordinator: AssignmentCoordinator;

  constructor(deps: AutoAssignmentEngineDependencies) {
    this.scoringEngine = new AssignmentScoringEngine();
    this.candidateGenerator = new AssignmentCandidateGenerator(
      deps.availabilityService,
      deps.tableRepository,
      deps.tableGroupRepository,
      deps.reservationRepository,
    );
    this.defaultStrategy = new DefaultAssignmentStrategy(this.scoringEngine);
    this.coordinator = new AssignmentCoordinator(this.candidateGenerator, this.defaultStrategy);
  }

  async assign(context: AssignmentContext): Promise<AssignmentResult> {
    return this.coordinator.assign(context);
  }

  async assignWithStrategy(
    context: AssignmentContext,
    strategy: AssignmentStrategy,
  ): Promise<AssignmentResult> {
    return this.coordinator.assignWithStrategy(context, strategy);
  }

  async getCandidates(context: AssignmentContext): Promise<AssignmentCandidate[]> {
    return this.coordinator.getCandidates(context);
  }

  withScoringFactors(factors: Partial<ScoringFactors>): AutoAssignmentEngine {
    this.scoringEngine.withFactors(factors);
    return this;
  }

  getScoringEngine(): AssignmentScoringEngine {
    return this.scoringEngine;
  }

  getCandidateGenerator(): AssignmentCandidateGenerator {
    return this.candidateGenerator;
  }

  getDefaultStrategy(): DefaultAssignmentStrategy {
    return this.defaultStrategy;
  }
}
