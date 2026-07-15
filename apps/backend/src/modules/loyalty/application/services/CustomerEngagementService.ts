import type { CustomerProfileRepository } from "../../domain/repositories/CustomerProfileRepository.js";
import type { LoyaltyProgramRepository } from "../../domain/repositories/LoyaltyProgramRepository.js";
import type { CustomerProfile } from "../../domain/models/CustomerProfile.js";
import type { CustomerSegment } from "../../domain/models/CustomerSegment.js";
import { SegmentationService } from "../../domain/services/SegmentationService.js";

export class CustomerEngagementService {
  private readonly segmentationService: SegmentationService;

  constructor(
    private readonly customerProfileRepo: CustomerProfileRepository,
    private readonly programRepo: LoyaltyProgramRepository,
  ) {
    this.segmentationService = new SegmentationService();
  }

  async getProfileSegments(customerProfileId: string): Promise<CustomerSegment[]> {
    const profile = await this.customerProfileRepo.findById(customerProfileId);
    if (!profile) throw new Error("Customer profile not found");
    const segments = await this.programRepo.findSegmentsByRestaurant(profile.restaurantId);
    return this.segmentationService.findMatchingSegments(profile, segments);
  }

  async getProfilesBySegment(segmentId: string): Promise<CustomerProfile[]> {
    const segment = await this.programRepo.findSegmentById(segmentId);
    if (!segment) throw new Error("Segment not found");
    const profiles = await this.customerProfileRepo.findByRestaurant(segment.restaurantId);
    return profiles.filter((p) => this.segmentationService.evaluateProfile(p, segment));
  }

  async getBirthdayProfiles(restaurantId: string): Promise<CustomerProfile[]> {
    const profiles = await this.customerProfileRepo.findByRestaurant(restaurantId);
    const currentMonth = new Date().getMonth();
    return profiles.filter((p) => {
      if (!p.dateOfBirth) return false;
      return new Date(p.dateOfBirth).getMonth() === currentMonth;
    });
  }

  async getAnniversaryProfiles(restaurantId: string): Promise<CustomerProfile[]> {
    const profiles = await this.customerProfileRepo.findByRestaurant(restaurantId);
    const currentMonth = new Date().getMonth();
    return profiles.filter((p) => {
      if (!p.anniversaryDate) return false;
      return new Date(p.anniversaryDate).getMonth() === currentMonth;
    });
  }

  async getChurnedProfiles(restaurantId: string, daysInactive: number = 180): Promise<CustomerProfile[]> {
    const profiles = await this.customerProfileRepo.findByRestaurant(restaurantId);
    const cutoff = new Date(Date.now() - daysInactive * 86400000);
    return profiles.filter((p) => !p.lastVisitAt || p.lastVisitAt < cutoff);
  }

  async updatePreferences(config: {
    customerProfileId: string;
    favoriteCuisines?: string[];
    dietaryRestrictions?: string[];
    seatingPreferences?: string[];
    marketingOptIn?: boolean;
  }): Promise<CustomerProfile> {
    const profile = await this.customerProfileRepo.findById(config.customerProfileId);
    if (!profile) throw new Error("Customer profile not found");
    const updated = profile.updatePreferences(config);
    await this.customerProfileRepo.save(updated);
    return updated;
  }

  async addTag(customerProfileId: string, tag: string): Promise<CustomerProfile> {
    const profile = await this.customerProfileRepo.findById(customerProfileId);
    if (!profile) throw new Error("Customer profile not found");
    const updated = profile.addTag(tag);
    await this.customerProfileRepo.save(updated);
    return updated;
  }

  getSegmentationService(): SegmentationService { return this.segmentationService; }
}
