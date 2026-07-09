import { describe, it, expect } from "vitest";
import { PartySize } from "../domain/models/PartySize.js";
import { ReservationDuration } from "../domain/models/ReservationDuration.js";
import { AdvanceBookingWindow } from "../domain/models/AdvanceBookingWindow.js";
import { CancellationDeadline } from "../domain/models/CancellationDeadline.js";
import { GracePeriod } from "../domain/models/GracePeriod.js";

describe("PartySize", () => {
  describe("create", () => {
    it("creates from a valid party size", () => {
      const ps = PartySize.create(4);
      expect(ps.value).toBe(4);
    });

    it("creates from minimum", () => {
      expect(PartySize.create(1).value).toBe(1);
    });

    it("creates from maximum", () => {
      expect(PartySize.create(100).value).toBe(100);
    });

    it("throws for size below minimum", () => {
      expect(() => PartySize.create(0)).toThrow("Party size must be an integer between 1 and 100");
    });

    it("throws for size above maximum", () => {
      expect(() => PartySize.create(101)).toThrow("Party size must be an integer between 1 and 100");
    });

    it("throws for non-integer", () => {
      expect(() => PartySize.create(2.5)).toThrow();
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const ps = PartySize.reconstitute(4);
      expect(ps.value).toBe(4);
    });
  });

  describe("equals", () => {
    it("returns true for equal sizes", () => {
      expect(PartySize.create(4).equals(PartySize.create(4))).toBe(true);
    });

    it("returns false for different sizes", () => {
      expect(PartySize.create(2).equals(PartySize.create(4))).toBe(false);
    });
  });
});

describe("ReservationDuration", () => {
  describe("create", () => {
    it("creates from a valid duration", () => {
      const rd = ReservationDuration.create(60);
      expect(rd.value).toBe(60);
    });

    it("throws for duration below minimum", () => {
      expect(() => ReservationDuration.create(14)).toThrow("Reservation duration must be an integer between 15 and 480 minutes");
    });

    it("throws for duration above maximum", () => {
      expect(() => ReservationDuration.create(481)).toThrow();
    });

    it("throws for non-integer", () => {
      expect(() => ReservationDuration.create(30.5)).toThrow();
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      expect(ReservationDuration.reconstitute(90).value).toBe(90);
    });
  });

  describe("equals", () => {
    it("returns true for equal durations", () => {
      expect(ReservationDuration.create(60).equals(ReservationDuration.create(60))).toBe(true);
    });

    it("returns false for different durations", () => {
      expect(ReservationDuration.create(60).equals(ReservationDuration.create(90))).toBe(false);
    });
  });
});

describe("AdvanceBookingWindow", () => {
  describe("create", () => {
    it("creates from valid values", () => {
      const w = AdvanceBookingWindow.create(60, 30);
      expect(w.minMinutes).toBe(60);
      expect(w.maxDays).toBe(30);
    });

    it("throws for minMinutes below minimum", () => {
      expect(() => AdvanceBookingWindow.create(-1, 30)).toThrow();
    });

    it("throws for minMinutes above maximum", () => {
      expect(() => AdvanceBookingWindow.create(43201, 30)).toThrow();
    });

    it("throws for maxDays below minimum", () => {
      expect(() => AdvanceBookingWindow.create(60, -1)).toThrow();
    });

    it("throws for maxDays above maximum", () => {
      expect(() => AdvanceBookingWindow.create(60, 366)).toThrow();
    });

    it("throws for non-integer minMinutes", () => {
      expect(() => AdvanceBookingWindow.create(30.5, 30)).toThrow();
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const w = AdvanceBookingWindow.reconstitute(120, 14);
      expect(w.minMinutes).toBe(120);
      expect(w.maxDays).toBe(14);
    });
  });

  describe("equals", () => {
    it("returns true for equal windows", () => {
      expect(AdvanceBookingWindow.create(60, 30).equals(AdvanceBookingWindow.create(60, 30))).toBe(true);
    });

    it("returns false for different windows", () => {
      expect(AdvanceBookingWindow.create(60, 30).equals(AdvanceBookingWindow.create(120, 30))).toBe(false);
    });
  });
});

describe("CancellationDeadline", () => {
  describe("create", () => {
    it("creates from a valid deadline", () => {
      const cd = CancellationDeadline.create(1440);
      expect(cd.value).toBe(1440);
    });

    it("allows zero", () => {
      expect(CancellationDeadline.create(0).value).toBe(0);
    });

    it("throws for deadline below minimum", () => {
      expect(() => CancellationDeadline.create(-1)).toThrow();
    });

    it("throws for deadline above maximum", () => {
      expect(() => CancellationDeadline.create(43201)).toThrow();
    });

    it("throws for non-integer", () => {
      expect(() => CancellationDeadline.create(60.5)).toThrow();
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      expect(CancellationDeadline.reconstitute(60).value).toBe(60);
    });
  });

  describe("equals", () => {
    it("returns true for equal deadlines", () => {
      expect(CancellationDeadline.create(1440).equals(CancellationDeadline.create(1440))).toBe(true);
    });

    it("returns false for different deadlines", () => {
      expect(CancellationDeadline.create(60).equals(CancellationDeadline.create(1440))).toBe(false);
    });
  });
});

describe("GracePeriod", () => {
  describe("create", () => {
    it("creates from a valid grace period", () => {
      const gp = GracePeriod.create(15);
      expect(gp.value).toBe(15);
    });

    it("allows zero", () => {
      expect(GracePeriod.create(0).value).toBe(0);
    });

    it("throws for period below minimum", () => {
      expect(() => GracePeriod.create(-1)).toThrow();
    });

    it("throws for period above maximum", () => {
      expect(() => GracePeriod.create(121)).toThrow();
    });

    it("throws for non-integer", () => {
      expect(() => GracePeriod.create(10.5)).toThrow();
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      expect(GracePeriod.reconstitute(10).value).toBe(10);
    });
  });

  describe("equals", () => {
    it("returns true for equal periods", () => {
      expect(GracePeriod.create(15).equals(GracePeriod.create(15))).toBe(true);
    });

    it("returns false for different periods", () => {
      expect(GracePeriod.create(10).equals(GracePeriod.create(15))).toBe(false);
    });
  });
});
