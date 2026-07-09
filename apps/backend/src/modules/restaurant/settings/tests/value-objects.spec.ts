import { describe, it, expect } from "vitest";
import { DateFormat } from "../domain/models/DateFormat.js";
import { TimeFormat } from "../domain/models/TimeFormat.js";
import { ReservationDuration } from "../domain/models/ReservationDuration.js";
import { TaxPercentage } from "../domain/models/TaxPercentage.js";
import { ReservationBufferMinutes } from "../domain/models/ReservationBufferMinutes.js";

describe("DateFormat", () => {
  describe("create", () => {
    it("creates from a valid format", () => {
      const df = DateFormat.create("YYYY-MM-DD");
      expect(df.value).toBe("YYYY-MM-DD");
    });

    it("creates from DD/MM/YYYY", () => {
      const df = DateFormat.create("DD/MM/YYYY");
      expect(df.value).toBe("DD/MM/YYYY");
    });

    it("throws for invalid format", () => {
      expect(() => DateFormat.create("invalid")).toThrow("Invalid date format");
    });

    it("throws for empty string", () => {
      expect(() => DateFormat.create("")).toThrow("Invalid date format");
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const df = DateFormat.reconstitute("YYYY-MM-DD");
      expect(df.value).toBe("YYYY-MM-DD");
    });
  });

  describe("equals", () => {
    it("returns true for equal formats", () => {
      expect(DateFormat.create("YYYY-MM-DD").equals(DateFormat.create("YYYY-MM-DD"))).toBe(true);
    });

    it("returns false for different formats", () => {
      expect(DateFormat.create("YYYY-MM-DD").equals(DateFormat.create("DD/MM/YYYY"))).toBe(false);
    });
  });
});

describe("TimeFormat", () => {
  describe("create", () => {
    it("creates from a valid format", () => {
      const tf = TimeFormat.create("HH:mm");
      expect(tf.value).toBe("HH:mm");
    });

    it("creates from 12-hour format", () => {
      const tf = TimeFormat.create("hh:mm A");
      expect(tf.value).toBe("hh:mm A");
    });

    it("throws for invalid format", () => {
      expect(() => TimeFormat.create("invalid")).toThrow("Invalid time format");
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const tf = TimeFormat.reconstitute("HH:mm");
      expect(tf.value).toBe("HH:mm");
    });
  });

  describe("equals", () => {
    it("returns true for equal formats", () => {
      expect(TimeFormat.create("HH:mm").equals(TimeFormat.create("HH:mm"))).toBe(true);
    });

    it("returns false for different formats", () => {
      expect(TimeFormat.create("HH:mm").equals(TimeFormat.create("hh:mm A"))).toBe(false);
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
      expect(() => ReservationDuration.create(10)).toThrow("between 15 and 480");
    });

    it("throws for duration above maximum", () => {
      expect(() => ReservationDuration.create(500)).toThrow("between 15 and 480");
    });

    it("throws for non-integer", () => {
      expect(() => ReservationDuration.create(30.5)).toThrow("must be an integer");
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const rd = ReservationDuration.reconstitute(90);
      expect(rd.value).toBe(90);
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

describe("TaxPercentage", () => {
  describe("create", () => {
    it("creates from a valid percentage", () => {
      const tp = TaxPercentage.create(10);
      expect(tp.value).toBe(10);
    });

    it("creates from zero", () => {
      const tp = TaxPercentage.create(0);
      expect(tp.value).toBe(0);
    });

    it("rounds to 2 decimal places", () => {
      const tp = TaxPercentage.create(10.555);
      expect(tp.value).toBe(10.56);
    });

    it("throws for negative value", () => {
      expect(() => TaxPercentage.create(-1)).toThrow("between 0 and 100");
    });

    it("throws for value above 100", () => {
      expect(() => TaxPercentage.create(101)).toThrow("between 0 and 100");
    });

    it("throws for NaN", () => {
      expect(() => TaxPercentage.create(NaN)).toThrow("must be a number");
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const tp = TaxPercentage.reconstitute(8.5);
      expect(tp.value).toBe(8.5);
    });
  });

  describe("toDecimal", () => {
    it("converts to decimal", () => {
      expect(TaxPercentage.create(10).toDecimal()).toBe(0.1);
    });
  });

  describe("equals", () => {
    it("returns true for equal percentages", () => {
      expect(TaxPercentage.create(10).equals(TaxPercentage.create(10))).toBe(true);
    });

    it("returns false for different percentages", () => {
      expect(TaxPercentage.create(10).equals(TaxPercentage.create(12))).toBe(false);
    });
  });
});

describe("ReservationBufferMinutes", () => {
  describe("create", () => {
    it("creates from a valid buffer", () => {
      const rb = ReservationBufferMinutes.create(15);
      expect(rb.value).toBe(15);
    });

    it("allows zero", () => {
      const rb = ReservationBufferMinutes.create(0);
      expect(rb.value).toBe(0);
    });

    it("throws for buffer below minimum", () => {
      expect(() => ReservationBufferMinutes.create(-1)).toThrow("between 0 and 120");
    });

    it("throws for buffer above maximum", () => {
      expect(() => ReservationBufferMinutes.create(121)).toThrow("between 0 and 120");
    });

    it("throws for non-integer", () => {
      expect(() => ReservationBufferMinutes.create(15.5)).toThrow("must be an integer");
    });
  });

  describe("reconstitute", () => {
    it("creates without validation", () => {
      const rb = ReservationBufferMinutes.reconstitute(30);
      expect(rb.value).toBe(30);
    });
  });

  describe("equals", () => {
    it("returns true for equal buffers", () => {
      expect(ReservationBufferMinutes.create(15).equals(ReservationBufferMinutes.create(15))).toBe(true);
    });

    it("returns false for different buffers", () => {
      expect(ReservationBufferMinutes.create(15).equals(ReservationBufferMinutes.create(30))).toBe(false);
    });
  });
});
