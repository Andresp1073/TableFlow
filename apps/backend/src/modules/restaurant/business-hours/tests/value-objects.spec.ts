import { describe, it, expect } from "vitest";
import { DayOfWeek } from "../domain/models/DayOfWeek.js";
import { OpeningTime } from "../domain/models/OpeningTime.js";
import { ClosingTime } from "../domain/models/ClosingTime.js";
import { TimeRange } from "../domain/models/TimeRange.js";
import { OpeningPeriod } from "../domain/models/OpeningPeriod.js";
import { DaySchedule } from "../domain/models/DaySchedule.js";

describe("DayOfWeek", () => {
  describe("create", () => {
    it("creates from valid day", () => {
      const day = DayOfWeek.create(1);
      expect(day.value).toBe(1);
    });

    it("creates from maximum", () => {
      const day = DayOfWeek.create(7);
      expect(day.value).toBe(7);
    });

    it("throws for day below minimum", () => {
      expect(() => DayOfWeek.create(0)).toThrow();
    });

    it("throws for day above maximum", () => {
      expect(() => DayOfWeek.create(8)).toThrow();
    });

    it("throws for non-integer", () => {
      expect(() => DayOfWeek.create(1.5)).toThrow();
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const day = DayOfWeek.reconstitute(3);
      expect(day.value).toBe(3);
    });
  });

  describe("equals", () => {
    it("returns true for equal days", () => {
      expect(DayOfWeek.create(1).equals(DayOfWeek.create(1))).toBe(true);
    });

    it("returns false for different days", () => {
      expect(DayOfWeek.create(1).equals(DayOfWeek.create(2))).toBe(false);
    });
  });
});

describe("OpeningTime", () => {
  describe("create", () => {
    it("creates from valid time", () => {
      const time = OpeningTime.create(480);
      expect(time.value).toBe(480);
    });

    it("throws for negative", () => {
      expect(() => OpeningTime.create(-1)).toThrow();
    });

    it("throws above maximum", () => {
      expect(() => OpeningTime.create(1440)).toThrow();
    });
  });

  describe("fromString", () => {
    it("parses HH:MM format", () => {
      const time = OpeningTime.fromString("08:00");
      expect(time.value).toBe(480);
    });

    it("throws for invalid format", () => {
      expect(() => OpeningTime.fromString("25:00")).toThrow();
    });
  });

  describe("toString", () => {
    it("formats as HH:MM", () => {
      expect(OpeningTime.create(480).toString()).toBe("08:00");
    });
  });
});

describe("ClosingTime", () => {
  describe("create", () => {
    it("creates from valid time", () => {
      const time = ClosingTime.create(900);
      expect(time.value).toBe(900);
    });

    it("throws for negative", () => {
      expect(() => ClosingTime.create(-1)).toThrow();
    });

    it("throws above maximum", () => {
      expect(() => ClosingTime.create(1440)).toThrow();
    });
  });

  describe("fromString", () => {
    it("parses HH:MM format", () => {
      const time = ClosingTime.fromString("15:00");
      expect(time.value).toBe(900);
    });
  });

  describe("toString", () => {
    it("formats as HH:MM", () => {
      expect(ClosingTime.create(900).toString()).toBe("15:00");
    });
  });
});

describe("TimeRange", () => {
  describe("create", () => {
    it("creates when open before close", () => {
      const range = TimeRange.create(OpeningTime.create(480), ClosingTime.create(900));
      expect(range.open.value).toBe(480);
      expect(range.close.value).toBe(900);
    });

    it("throws when open equals close", () => {
      expect(() =>
        TimeRange.create(OpeningTime.create(480), ClosingTime.create(480)),
      ).toThrow();
    });

    it("throws when open after close", () => {
      expect(() =>
        TimeRange.create(OpeningTime.create(900), ClosingTime.create(480)),
      ).toThrow();
    });
  });

  describe("overlaps", () => {
    it("detects overlapping ranges", () => {
      const a = TimeRange.create(OpeningTime.create(480), ClosingTime.create(720));
      const b = TimeRange.create(OpeningTime.create(600), ClosingTime.create(900));
      expect(a.overlaps(b)).toBe(true);
    });

    it("detects non-overlapping ranges", () => {
      const a = TimeRange.create(OpeningTime.create(480), ClosingTime.create(600));
      const b = TimeRange.create(OpeningTime.create(600), ClosingTime.create(900));
      expect(a.overlaps(b)).toBe(false);
    });

    it("detects fully contained ranges", () => {
      const a = TimeRange.create(OpeningTime.create(480), ClosingTime.create(900));
      const b = TimeRange.create(OpeningTime.create(540), ClosingTime.create(720));
      expect(a.overlaps(b)).toBe(true);
    });
  });
});

describe("OpeningPeriod", () => {
  describe("create", () => {
    it("creates valid period", () => {
      const period = OpeningPeriod.create(
        OpeningTime.create(480),
        ClosingTime.create(900),
        0,
      );
      expect(period.openTime.value).toBe(480);
      expect(period.closeTime.value).toBe(900);
      expect(period.order).toBe(0);
    });

    it("throws for negative order", () => {
      expect(() =>
        OpeningPeriod.create(OpeningTime.create(480), ClosingTime.create(900), -1),
      ).toThrow();
    });
  });
});

describe("DaySchedule", () => {
  it("creates a closed day without periods", () => {
    const schedule = DaySchedule.create(DayOfWeek.create(7), true, []);
    expect(schedule.isClosed).toBe(true);
    expect(schedule.periods).toHaveLength(0);
  });

  it("creates an open day with periods", () => {
    const periods = [
      OpeningPeriod.create(OpeningTime.create(480), ClosingTime.create(720), 0),
      OpeningPeriod.create(OpeningTime.create(780), ClosingTime.create(1020), 1),
    ];
    const schedule = DaySchedule.create(DayOfWeek.create(1), false, periods);
    expect(schedule.periods).toHaveLength(2);
  });

  it("throws when closed day has periods", () => {
    const periods = [
      OpeningPeriod.create(OpeningTime.create(480), ClosingTime.create(720), 0),
    ];
    expect(() => DaySchedule.create(DayOfWeek.create(7), true, periods)).toThrow();
  });

  it("throws on overlapping periods", () => {
    const periods = [
      OpeningPeriod.create(OpeningTime.create(480), ClosingTime.create(720), 0),
      OpeningPeriod.create(OpeningTime.create(600), ClosingTime.create(900), 1),
    ];
    expect(() => DaySchedule.create(DayOfWeek.create(1), false, periods)).toThrow();
  });

  it("sorts periods by order", () => {
    const periods = [
      OpeningPeriod.create(OpeningTime.create(780), ClosingTime.create(1020), 1),
      OpeningPeriod.create(OpeningTime.create(480), ClosingTime.create(720), 0),
    ];
    const schedule = DaySchedule.create(DayOfWeek.create(1), false, periods);
    expect(schedule.periods[0].order).toBe(0);
    expect(schedule.periods[1].order).toBe(1);
  });
});
