import type { WaitlistRepository } from "./WaitlistRepository.js";
import type { WaitlistEntry } from "./WaitlistEntry.js";
import type { AvailabilityService } from "../../application/ports/AvailabilityService.js";
import type { ReservationSource } from "../../domain/models/ReservationSource.js";
import { WaitlistManager, type CreateWaitlistInput, type UpdateWaitlistInput } from "./WaitlistManager.js";
import { WaitlistPriorityCalculator } from "./WaitlistPriorityCalculator.js";
import { WaitlistCandidateSelector } from "./WaitlistCandidateSelector.js";
import { WaitlistPromotionCoordinator } from "./WaitlistPromotionCoordinator.js";
import { WaitlistEligibilityPolicy } from "./WaitlistEligibilityPolicy.js";

export interface WaitlistEngineDependencies {
  repository: WaitlistRepository;
  availabilityService: AvailabilityService;
}

export class WaitlistEngine {
  public readonly manager: WaitlistManager;
  public readonly priorityCalculator: WaitlistPriorityCalculator;
  public readonly candidateSelector: WaitlistCandidateSelector;
  public readonly promotionCoordinator: WaitlistPromotionCoordinator;
  public readonly eligibilityPolicy: WaitlistEligibilityPolicy;

  constructor(private readonly deps: WaitlistEngineDependencies) {
    this.eligibilityPolicy = new WaitlistEligibilityPolicy();
    this.priorityCalculator = new WaitlistPriorityCalculator();
    this.candidateSelector = new WaitlistCandidateSelector(
      deps.availabilityService,
      this.priorityCalculator,
      this.eligibilityPolicy,
    );
    this.manager = new WaitlistManager(
      deps.repository,
      this.eligibilityPolicy,
      this.priorityCalculator,
    );
    this.promotionCoordinator = new WaitlistPromotionCoordinator(
      deps.repository,
      this.candidateSelector,
      this.eligibilityPolicy,
      this.priorityCalculator,
    );
  }

  async addToWaitlist(input: CreateWaitlistInput): Promise<WaitlistEntry> {
    return this.manager.addToWaitlist(input);
  }

  async updateWaitlist(input: UpdateWaitlistInput): Promise<WaitlistEntry> {
    return this.manager.updateWaitlist(input);
  }

  async removeFromWaitlist(id: string, restaurantId: string): Promise<void> {
    return this.manager.removeFromWaitlist(id, restaurantId);
  }

  async cancelWaitlist(id: string, restaurantId: string): Promise<WaitlistEntry> {
    return this.manager.cancelWaitlist(id, restaurantId);
  }

  async promoteNext(restaurantId: string) {
    return this.promotionCoordinator.promoteNext(restaurantId);
  }

  async getWaitlist(restaurantId: string): Promise<WaitlistEntry[]> {
    return this.manager.getWaitlist(restaurantId);
  }

  async getActiveWaitlist(restaurantId: string): Promise<WaitlistEntry[]> {
    return this.manager.getActiveWaitlist(restaurantId);
  }

  async getPosition(id: string, restaurantId: string): Promise<number> {
    return this.manager.getPosition(id, restaurantId);
  }

  async findNextCandidates(restaurantId: string, limit = 5): Promise<WaitlistEntry[]> {
    return this.promotionCoordinator.findNextCandidates(restaurantId, limit);
  }

  async getWaitlistCount(restaurantId: string): Promise<number> {
    return this.deps.repository.countByRestaurant(restaurantId);
  }
}
