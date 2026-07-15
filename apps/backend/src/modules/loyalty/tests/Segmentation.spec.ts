import { describe, it, expect } from "vitest";
import { SegmentationService } from "../domain/services/SegmentationService.js";
import { CustomerProfile, CustomerTier } from "../domain/models/CustomerProfile.js";
import { CustomerSegment, VisitFrequency, SpendingLevel, EngagementLevel } from "../domain/models/CustomerSegment.js";

function makeProfile(overrides?: Record<string, unknown>): CustomerProfile {
  return CustomerProfile.reconstitute({
    id: "cp-1", restaurantId: "rest-1", customerId: "cust-1",
    firstName: "John", lastName: "Doe", email: "john@example.com",
    tier: CustomerTier.Gold, totalSpent: 5000, totalVisits: 50,
    firstVisitAt: new Date("2023-01-01"), lastVisitAt: new Date(Date.now() - 5 * 86400000),
    preferences: { favoriteCuisines: ["Italian", "Japanese"], marketingOptIn: true },
    tags: ["vip", "regular"], notes: "", isActive: true,
    enrolledAt: new Date(), updatedAt: new Date(),
    ...overrides,
  });
}

function makeSegment(overrides?: Record<string, unknown>): CustomerSegment {
  return CustomerSegment.reconstitute({
    id: "seg-1", restaurantId: "rest-1", name: "High Spenders",
    description: "Customers who spend a lot",
    criteria: { minTotalSpent: 1000, maxTotalSpent: null },
    isActive: true, createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  });
}

describe("SegmentationService", () => {
  const service = new SegmentationService();

  it("matches profile to segment by spending", () => {
    const profile = makeProfile({ totalSpent: 5000 });
    const segment = makeSegment({ criteria: { minTotalSpent: 1000 } });
    expect(service.evaluateProfile(profile, segment)).toBe(true);
  });

  it("excludes profile below minimum spend", () => {
    const profile = makeProfile({ totalSpent: 500 });
    const segment = makeSegment({ criteria: { minTotalSpent: 1000 } });
    expect(service.evaluateProfile(profile, segment)).toBe(false);
  });

  it("matches by visit frequency", () => {
    const profile = makeProfile({
      firstVisitAt: new Date(Date.now() - 365 * 86400000),
      totalVisits: 100,
    });
    const segment = makeSegment({ criteria: { visitFrequency: VisitFrequency.VeryHigh } });
    expect(service.evaluateProfile(profile, segment)).toBe(true);
  });

  it("matches by cuisine preference", () => {
    const profile = makeProfile({ preferences: { favoriteCuisines: ["Italian"], marketingOptIn: true } });
    const segment = makeSegment({ criteria: { preferredCuisines: ["Italian", "French"] } });
    expect(service.evaluateProfile(profile, segment)).toBe(true);
  });

  it("matches by tags", () => {
    const profile = makeProfile({ tags: ["vip", "regular"] });
    const segment = makeSegment({ criteria: { tags: ["vip"] } });
    expect(service.evaluateProfile(profile, segment)).toBe(true);
  });

  it("matches birthday month", () => {
    const now = new Date();
    const birthDate = new Date(now.getFullYear(), now.getMonth(), 15);
    const profile = makeProfile({ dateOfBirth: birthDate.toISOString() });
    const segment = makeSegment({ criteria: { isBirthdayMonth: true } });
    expect(service.evaluateProfile(profile, segment)).toBe(true);
  });

  it("calculates visit frequency correctly", () => {
    const profile = makeProfile({
      firstVisitAt: new Date(Date.now() - 365 * 86400000),
      totalVisits: 100,
      lastVisitAt: new Date(),
    });
    const freq = service.calculateVisitFrequency(profile);
    expect(freq).toBe(VisitFrequency.VeryHigh);
  });

  it("calculates spending level correctly", () => {
    const profile = makeProfile({ totalSpent: 5000, totalVisits: 50 });
    const level = service.calculateSpendingLevel(profile);
    expect(level).toBe(SpendingLevel.VeryHigh);
  });

  it("calculates engagement level correctly", () => {
    const recent = makeProfile({ lastVisitAt: new Date() });
    expect(service.calculateEngagementLevel(recent)).toBe(EngagementLevel.VeryHigh);

    const old = makeProfile({ lastVisitAt: new Date(Date.now() - 120 * 86400000) });
    expect(service.calculateEngagementLevel(old)).toBe(EngagementLevel.Low);
  });

  it("finds matching segments", () => {
    const profile = makeProfile({ totalSpent: 5000 });
    const seg1 = makeSegment({ criteria: { minTotalSpent: 1000 } });
    const seg2 = makeSegment({ criteria: { minTotalSpent: 10000 } });
    const matching = service.findMatchingSegments(profile, [seg1, seg2]);
    expect(matching).toHaveLength(1);
    expect(matching[0].id).toBe("seg-1");
  });
});
