import type { AssignmentCandidate, AssignmentContext } from "./types.js";
import type { AssignmentResult } from "./AssignmentResult.js";
import type { AssignmentCandidateGenerator } from "./AssignmentCandidateGenerator.js";
import type { AssignmentStrategy } from "./AssignmentStrategy.js";

export class AssignmentCoordinator {
  constructor(
    private readonly candidateGenerator: AssignmentCandidateGenerator,
    private readonly defaultStrategy: AssignmentStrategy,
  ) {}

  async assign(context: AssignmentContext): Promise<AssignmentResult> {
    const candidates = await this.candidateGenerator.generate(context);
    return this.defaultStrategy.select(candidates, context);
  }

  async assignWithStrategy(
    context: AssignmentContext,
    strategy: AssignmentStrategy,
  ): Promise<AssignmentResult> {
    const candidates = await this.candidateGenerator.generate(context);
    return strategy.select(candidates, context);
  }

  async getCandidates(context: AssignmentContext): Promise<AssignmentCandidate[]> {
    return this.candidateGenerator.generate(context);
  }
}
