import { describe, it, expect } from "vitest";
import { WaitlistEligibilityPolicy } from "../../../engine/waitlist/WaitlistEligibilityPolicy.js";
import { WaitlistStatus } from "../../../engine/waitlist/WaitlistStatus.js";
import { ReservationSource } from "../../../domain/models/ReservationSource.js";
import type { WaitlistEntry } from "../../../engine/waitlist/WaitlistEntry.js";

function createEntry(overrides: Partial<WaitlistEntry> = {}): WaitlistEntry {
  const now = new Date();
  return {
    id: "wl-1",
    restaurantId: "rest-1",
    reservationId: null,
    customerId: "cust-1",
    partySize: 4,
    source: ReservationSource.create("website"),
    requestedDate: new Date("2026-07-14"),
    requestedStartTime: new Date("2026-07-14T18:00:00Z"),
    requestedEndTime: new Date("2099-07-14T20:00:00Z"),
    status: WaitlistStatus.create("waiting"),
    priority: 0,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiredAt: null,
    promotedAt: null,
    ...overrides,
  };
}

describe("WaitlistEligibilityPolicy", () => {
  const policy = new WaitlistEligibilityPolicy();

  describe("canAddToWaitlist", () => {
    it("returns eligible for valid input", () => {
      const result = policy.canAddToWaitlist(
        4,
        new Date("2099-07-14T18:00:00Z"),
        new Date("2099-07-14T20:00:00Z"),
      );
      expect(result.eligible).toBe(true);
      expect(result.reason).toBeNull();
    });

    it("rejects zero party size", () => {
      const result = policy.canAddToWaitlist(
        0,
        new Date("2099-07-14T18:00:00Z"),
        new Date("2099-07-14T20:00:00Z"),
      );
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("Party size");
    });

    it("rejects party size exceeding maximum", () => {
      const result = policy.canAddToWaitlist(
        101,
        new Date("2099-07-14T18:00:00Z"),
        new Date("2099-07-14T20:00:00Z"),
      );
      expect(result.eligible).toBe(false);
    });

    it("rejects invalid time range", () => {
      const result = policy.canAddToWaitlist(
        4,
        new Date("2099-07-14T20:00:00Z"),
        new Date("2099-07-14T18:00:00Z"),
      );
      expect(result.eligible).toBe(false);
    });

    it("rejects past time", () => {
      const result = policy.canAddToWaitlist(
        4,
        new Date("2020-01-01T18:00:00Z"),
        new Date("2020-01-01T20:00:00Z"),
      );
      expect(result.eligible).toBe(false);
    });
  });

  describe("isEligibleForPromotion", () => {
    it("returns eligible for active waiting entry with future time", () => {
      const entry = createEntry();
      const result = policy.isEligibleForPromotion(entry);
      expect(result.eligible).toBe(true);
    });

    it("returns not eligible for terminal entries", () => {
      const entry = createEntry({ status: WaitlistStatus.create("promoted") });
      const result = policy.isEligibleForPromotion(entry);
      expect(result.eligible).toBe(false);
    });

    it("returns not eligible for cancelled entries", () => {
      const entry = createEntry({ status: WaitlistStatus.create("cancelled") });
      const result = policy.isEligibleForPromotion(entry);
      expect(result.eligible).toBe(false);
    });

    it("returns not eligible for expired entries", () => {
      const entry = createEntry({ status: WaitlistStatus.create("expired") });
      const result = policy.isEligibleForPromotion(entry);
      expect(result.eligible).toBe(false);
    });
  });

  describe("canExtendWaitlist", () => {
    it("allows extension with future time", () => {
      const entry = createEntry();
      const result = policy.canExtendWaitlist(
        entry,
        new Date("2099-07-14T22:00:00Z"),
      );
      expect(result.eligible).toBe(true);
    });

    it("rejects extension for terminal entry", () => {
      const entry = createEntry({ status: WaitlistStatus.create("promoted") });
      const result = policy.canExtendWaitlist(
        entry,
        new Date("2099-07-14T22:00:00Z"),
      );
      expect(result.eligible).toBe(false);
    });

    it("rejects extension to past time", () => {
      const entry = createEntry();
      const result = policy.canExtendWaitlist(
        entry,
        new Date("2020-01-01T22:00:00Z"),
      );
      expect(result.eligible).toBe(false);
    });

    it("rejects extension that is not after current end time", () => {
      const entry = createEntry({
        requestedEndTime: new Date("2099-07-14T20:00:00Z"),
      });
      const result = policy.canExtendWaitlist(
        entry,
        new Date("2099-07-14T19:00:00Z"),
      );
      expect(result.eligible).toBe(false);
    });
  });
});
