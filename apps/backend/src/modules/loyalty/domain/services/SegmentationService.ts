import type { CustomerProfile } from "../models/CustomerProfile.js";
import type { CustomerSegment, SegmentCriteria } from "../models/CustomerSegment.js";
import { VisitFrequency, SpendingLevel, EngagementLevel } from "../models/CustomerSegment.js";

export class SegmentationService {
  evaluateProfile(profile: CustomerProfile, segment: CustomerSegment): boolean {
    return this.matchesCriteria(profile, segment.criteria);
  }

  findMatchingSegments(profile: CustomerProfile, segments: CustomerSegment[]): CustomerSegment[] {
    return segments.filter((s) => this.evaluateProfile(profile, s));
  }

  private matchesCriteria(profile: CustomerProfile, criteria: SegmentCriteria): boolean {
    if (criteria.minTotalSpent !== undefined && profile.totalSpent < criteria.minTotalSpent) return false;
    if (criteria.maxTotalSpent !== undefined && profile.totalSpent > criteria.maxTotalSpent) return false;
    if (criteria.minTotalVisits !== undefined && profile.totalVisits < criteria.minTotalVisits) return false;
    if (criteria.maxTotalVisits !== undefined && profile.totalVisits > criteria.maxTotalVisits) return false;

    if (criteria.visitFrequency !== undefined) {
      const freq = this.calculateVisitFrequency(profile);
      if (freq !== criteria.visitFrequency) return false;
    }

    if (criteria.spendingLevel !== undefined) {
      const level = this.calculateSpendingLevel(profile);
      if (level !== criteria.spendingLevel) return false;
    }

    if (criteria.engagementLevel !== undefined) {
      const level = this.calculateEngagementLevel(profile);
      if (level !== criteria.engagementLevel) return false;
    }

    if (criteria.preferredCuisines && criteria.preferredCuisines.length > 0) {
      const profileCuisines = profile.preferences.favoriteCuisines ?? [];
      const hasMatch = criteria.preferredCuisines.some((c) => profileCuisines.includes(c));
      if (!hasMatch) return false;
    }

    if (criteria.tags && criteria.tags.length > 0) {
      const hasTag = criteria.tags.some((t) => profile.tags.includes(t));
      if (!hasTag) return false;
    }

    if (criteria.minDaysSinceLastVisit !== undefined && profile.lastVisitAt) {
      const days = Math.floor((Date.now() - profile.lastVisitAt.getTime()) / 86400000);
      if (days < criteria.minDaysSinceLastVisit) return false;
    }

    if (criteria.maxDaysSinceLastVisit !== undefined && profile.lastVisitAt) {
      const days = Math.floor((Date.now() - profile.lastVisitAt.getTime()) / 86400000);
      if (days > criteria.maxDaysSinceLastVisit) return false;
    }

    if (criteria.isBirthdayMonth && profile.dateOfBirth) {
      const now = new Date();
      const birthMonth = new Date(profile.dateOfBirth).getMonth();
      if (now.getMonth() !== birthMonth) return false;
    }

    if (criteria.isAnniversaryMonth && profile.anniversaryDate) {
      const now = new Date();
      const annivMonth = new Date(profile.anniversaryDate).getMonth();
      if (now.getMonth() !== annivMonth) return false;
    }

    return true;
  }

  calculateVisitFrequency(profile: CustomerProfile): VisitFrequency {
    if (profile.totalVisits === 0 || !profile.firstVisitAt) return VisitFrequency.VeryLow;
    const daysSinceFirst = Math.max(1, Math.floor((Date.now() - profile.firstVisitAt.getTime()) / 86400000));
    const visitsPerYear = (profile.totalVisits / daysSinceFirst) * 365;

    if (visitsPerYear >= 52) return VisitFrequency.VeryHigh;
    if (visitsPerYear >= 24) return VisitFrequency.High;
    if (visitsPerYear >= 12) return VisitFrequency.Medium;
    if (visitsPerYear >= 4) return VisitFrequency.Low;
    return VisitFrequency.VeryLow;
  }

  calculateSpendingLevel(profile: CustomerProfile): SpendingLevel {
    if (profile.totalSpent === 0 || profile.totalVisits === 0) return SpendingLevel.VeryLow;
    const avgPerVisit = profile.totalSpent / profile.totalVisits;

    if (avgPerVisit >= 100) return SpendingLevel.VeryHigh;
    if (avgPerVisit >= 50) return SpendingLevel.High;
    if (avgPerVisit >= 25) return SpendingLevel.Medium;
    if (avgPerVisit >= 10) return SpendingLevel.Low;
    return SpendingLevel.VeryLow;
  }

  calculateEngagementLevel(profile: CustomerProfile): EngagementLevel {
    if (!profile.lastVisitAt) return EngagementLevel.Inactive;
    const daysSinceLastVisit = Math.floor((Date.now() - profile.lastVisitAt.getTime()) / 86400000);

    if (daysSinceLastVisit <= 7) return EngagementLevel.VeryHigh;
    if (daysSinceLastVisit <= 30) return EngagementLevel.High;
    if (daysSinceLastVisit <= 90) return EngagementLevel.Medium;
    if (daysSinceLastVisit <= 180) return EngagementLevel.Low;
    return EngagementLevel.Inactive;
  }
}
