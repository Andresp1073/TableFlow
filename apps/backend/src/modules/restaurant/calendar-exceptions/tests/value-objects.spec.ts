import { describe, it, expect, afterEach } from "vitest";
import { ExceptionDate } from "../domain/models/ExceptionDate.js";
import { ExceptionType } from "../domain/models/ExceptionType.js";
import { OpeningPeriod } from "../domain/models/OpeningPeriod.js";
import { Priority } from "../domain/models/Priority.js";

describe("ExceptionDate", () => {
  describe("create", () => {
    it("creates from valid YYYY-MM-DD format", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const dateStr = futureDate.toISOString().slice(0, 10);
      const date = ExceptionDate.create(dateStr, true);
      expect(date.value).toBe(dateStr);
    });

    it("throws for invalid format", () => {
      expect(() => ExceptionDate.create("01-15-2026", true)).toThrow();
    });

    it("throws for invalid date", () => {
      expect(() => ExceptionDate.create("2026-13-01", true)).toThrow();
    });
  });

  describe("past date validation", () => {
    it("throws for past dates by default", () => {
      expect(() => ExceptionDate.create("2020-01-01")).toThrow();
    });

    it("allows past dates when allowPast is true", () => {
      const date = ExceptionDate.create("2020-01-01", true);
      expect(date.value).toBe("2020-01-01");
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const date = ExceptionDate.reconstitute("2026-12-25");
      expect(date.value).toBe("2026-12-25");
    });
  });

  describe("equals", () => {
    it("returns true for equal dates", () => {
      const a = ExceptionDate.reconstitute("2026-12-25");
      const b = ExceptionDate.reconstitute("2026-12-25");
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different dates", () => {
      const a = ExceptionDate.reconstitute("2026-12-25");
      const b = ExceptionDate.reconstitute("2026-12-26");
      expect(a.equals(b)).toBe(false);
    });
  });

  describe("toDate", () => {
    it("converts to Date object", () => {
      const date = ExceptionDate.reconstitute("2026-12-25");
      const d = date.toDate();
      expect(d.getUTCFullYear()).toBe(2026);
      expect(d.getUTCMonth()).toBe(11);
      expect(d.getUTCDate()).toBe(25);
    });
  });
});

describe("ExceptionType", () => {
  describe("create", () => {
    it("creates from valid type", () => {
      const type = ExceptionType.create("holiday");
      expect(type.value).toBe("holiday");
    });

    it("normalizes hyphens to underscores", () => {
      const type = ExceptionType.create("special-opening");
      expect(type.value).toBe("special_opening");
    });

    it("is case insensitive", () => {
      const type = ExceptionType.create("HOLIDAY");
      expect(type.value).toBe("holiday");
    });

    it("throws for invalid type", () => {
      expect(() => ExceptionType.create("invalid_type")).toThrow();
    });
  });

  describe("isClosure", () => {
    it("returns true for temporary_closure", () => {
      expect(ExceptionType.create("temporary_closure").isClosure()).toBe(true);
    });

    it("returns true for emergency_closure", () => {
      expect(ExceptionType.create("emergency_closure").isClosure()).toBe(true);
    });

    it("returns true for maintenance", () => {
      expect(ExceptionType.create("maintenance").isClosure()).toBe(true);
    });

    it("returns false for holiday", () => {
      expect(ExceptionType.create("holiday").isClosure()).toBe(false);
    });

    it("returns false for special_opening", () => {
      expect(ExceptionType.create("special_opening").isClosure()).toBe(false);
    });
  });

  describe("static constants", () => {
    it("has all type constants", () => {
      expect(ExceptionType.HOLIDAY).toBe("holiday");
      expect(ExceptionType.SPECIAL_OPENING).toBe("special_opening");
      expect(ExceptionType.TEMPORARY_CLOSURE).toBe("temporary_closure");
      expect(ExceptionType.MAINTENANCE).toBe("maintenance");
      expect(ExceptionType.PRIVATE_EVENT).toBe("private_event");
      expect(ExceptionType.SEASONAL_HOURS).toBe("seasonal_hours");
      expect(ExceptionType.EMERGENCY_CLOSURE).toBe("emergency_closure");
    });
  });
});

describe("OpeningPeriod", () => {
  describe("create", () => {
    it("creates when open before close", () => {
      const period = OpeningPeriod.create("09:00", "17:00");
      expect(period.openTime).toBe("09:00");
      expect(period.closeTime).toBe("17:00");
    });

    it("throws when open time is invalid format", () => {
      expect(() => OpeningPeriod.create("9:00", "17:00")).toThrow();
    });

    it("throws when close time is invalid format", () => {
      expect(() => OpeningPeriod.create("09:00", "5:00")).toThrow();
    });

    it("throws when open equals close", () => {
      expect(() => OpeningPeriod.create("09:00", "09:00")).toThrow();
    });

    it("throws when open after close", () => {
      expect(() => OpeningPeriod.create("17:00", "09:00")).toThrow();
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const period = OpeningPeriod.reconstitute("09:00", "17:00");
      expect(period.openTime).toBe("09:00");
    });
  });
});

describe("Priority", () => {
  describe("create", () => {
    it("creates from valid priority", () => {
      const priority = Priority.create(50);
      expect(priority.value).toBe(50);
    });

    it("creates from minimum", () => {
      const priority = Priority.create(0);
      expect(priority.value).toBe(0);
    });

    it("creates from maximum", () => {
      const priority = Priority.create(100);
      expect(priority.value).toBe(100);
    });

    it("throws for negative", () => {
      expect(() => Priority.create(-1)).toThrow();
    });

    it("throws above maximum", () => {
      expect(() => Priority.create(101)).toThrow();
    });

    it("throws for non-integer", () => {
      expect(() => Priority.create(50.5)).toThrow();
    });
  });

  describe("comparison", () => {
    it("isHigherThan returns true when higher", () => {
      expect(Priority.create(80).isHigherThan(Priority.create(50))).toBe(true);
    });

    it("isHigherThan returns false when lower", () => {
      expect(Priority.create(30).isHigherThan(Priority.create(50))).toBe(false);
    });

    it("isLowerThan returns true when lower", () => {
      expect(Priority.create(20).isLowerThan(Priority.create(50))).toBe(true);
    });
  });

  describe("static constants", () => {
    it("has default priority of 50", () => {
      expect(Priority.DEFAULT).toBe(50);
    });

    it("has min of 0 and max of 100", () => {
      expect(Priority.MIN).toBe(0);
      expect(Priority.MAX).toBe(100);
    });
  });
});
