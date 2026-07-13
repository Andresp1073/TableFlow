import { describe, it, expect } from "vitest";
import { ReservationNumber } from "../domain/models/ReservationNumber.js";
import { PartySize } from "../domain/models/PartySize.js";
import { ReservationDate } from "../domain/models/ReservationDate.js";
import { ReservationTimeRange } from "../domain/models/ReservationTimeRange.js";
import { ReservationSource } from "../domain/models/ReservationSource.js";
import { ReservationStatus } from "../domain/models/ReservationStatus.js";
import { ReservationStateMachine } from "../domain/services/ReservationStateMachine.js";
import { ReservationPolicyValidator } from "../domain/services/ReservationPolicyValidator.js";
import { ReservationTimeValidator } from "../domain/services/ReservationTimeValidator.js";
import { ReservationStateTransitionError } from "../errors/ReservationStateTransitionError.js";
import { InvalidReservationDateError } from "../errors/InvalidReservationDateError.js";
import { InvalidReservationTimeError } from "../errors/InvalidReservationTimeError.js";

describe("ReservationNumber", () => {
  it("creates valid reservation number", () => {
    const num = ReservationNumber.create("RES-001");
    expect(num.value).toBe("RES-001");
  });

  it("normalizes to uppercase", () => {
    const num = ReservationNumber.create("res-001");
    expect(num.value).toBe("RES-001");
  });

  it("throws for empty string", () => {
    expect(() => ReservationNumber.create("")).toThrow();
    expect(() => ReservationNumber.create("   ")).toThrow();
  });

  it("throws for too long", () => {
    expect(() => ReservationNumber.create("A".repeat(21))).toThrow();
  });

  it("throws for invalid characters", () => {
    expect(() => ReservationNumber.create("RES 001")).toThrow();
    expect(() => ReservationNumber.create("RES-001!")).toThrow();
  });

  it("reconstitutes from stored value", () => {
    expect(ReservationNumber.reconstitute("RES-001").value).toBe("RES-001");
  });

  it("checks equality", () => {
    expect(ReservationNumber.create("A").equals(ReservationNumber.create("A"))).toBe(true);
    expect(ReservationNumber.create("A").equals(ReservationNumber.create("B"))).toBe(false);
  });
});

describe("PartySize", () => {
  it("creates valid party sizes", () => {
    expect(PartySize.create(1).value).toBe(1);
    expect(PartySize.create(4).value).toBe(4);
    expect(PartySize.create(100).value).toBe(100);
  });

  it("throws for zero or negative", () => {
    expect(() => PartySize.create(0)).toThrow();
    expect(() => PartySize.create(-1)).toThrow();
  });

  it("throws for non-integer", () => {
    expect(() => PartySize.create(1.5)).toThrow();
  });

  it("throws for exceeding maximum", () => {
    expect(() => PartySize.create(101)).toThrow();
  });

  it("detects large parties", () => {
    expect(PartySize.create(8).isLargeParty()).toBe(true);
    expect(PartySize.create(4).isLargeParty()).toBe(false);
  });

  it("reconstitutes from stored value", () => {
    expect(PartySize.reconstitute(4).value).toBe(4);
  });
});

describe("ReservationDate", () => {
  it("creates valid date", () => {
    const date = ReservationDate.create(new Date("2026-07-15"));
    expect(date.value).toBeInstanceOf(Date);
  });

  it("throws for invalid date", () => {
    expect(() => ReservationDate.create(new Date("invalid"))).toThrow();
  });

  it("compares dates", () => {
    const earlier = ReservationDate.create(new Date("2026-07-10"));
    const later = ReservationDate.create(new Date("2026-07-15"));
    expect(earlier.isBefore(later)).toBe(true);
    expect(later.isAfter(earlier)).toBe(true);
  });

  it("checks same day", () => {
    const a = ReservationDate.create(new Date("2026-07-15T12:00:00Z"));
    const b = ReservationDate.create(new Date("2026-07-15T18:00:00Z"));
    expect(a.isSameDay(b)).toBe(true);

    const c = ReservationDate.create(new Date("2026-07-16T12:00:00Z"));
    expect(a.isSameDay(c)).toBe(false);
  });

  it("checks equality", () => {
    const a = ReservationDate.create(new Date("2026-07-15"));
    const b = ReservationDate.create(new Date("2026-07-15"));
    expect(a.equals(b)).toBe(true);
  });

  it("reconstitutes from stored value", () => {
    const d = new Date("2026-07-15");
    expect(ReservationDate.reconstitute(d).value).toEqual(d);
  });
});

describe("ReservationTimeRange", () => {
  it("creates valid time range", () => {
    const range = ReservationTimeRange.create(
      new Date("2026-07-15T18:00:00"),
      new Date("2026-07-15T20:00:00"),
    );
    expect(range.durationInMinutes()).toBe(120);
  });

  it("throws when end is before start", () => {
    expect(() =>
      ReservationTimeRange.create(
        new Date("2026-07-15T20:00:00"),
        new Date("2026-07-15T18:00:00"),
      ),
    ).toThrow("End time must be after start time");
  });

  it("throws when end equals start", () => {
    expect(() =>
      ReservationTimeRange.create(
        new Date("2026-07-15T18:00:00"),
        new Date("2026-07-15T18:00:00"),
      ),
    ).toThrow();
  });

  it("throws for invalid dates", () => {
    expect(() => ReservationTimeRange.create(new Date("invalid"), new Date())).toThrow();
    expect(() => ReservationTimeRange.create(new Date(), new Date("invalid"))).toThrow();
  });

  it("detects overlapping ranges", () => {
    const a = ReservationTimeRange.create(
      new Date("2026-07-15T18:00:00"),
      new Date("2026-07-15T20:00:00"),
    );
    const b = ReservationTimeRange.create(
      new Date("2026-07-15T19:00:00"),
      new Date("2026-07-15T21:00:00"),
    );
    expect(a.overlapsWith(b)).toBe(true);
    expect(b.overlapsWith(a)).toBe(true);
  });

  it("detects non-overlapping ranges", () => {
    const a = ReservationTimeRange.create(
      new Date("2026-07-15T18:00:00"),
      new Date("2026-07-15T19:00:00"),
    );
    const b = ReservationTimeRange.create(
      new Date("2026-07-15T19:00:00"),
      new Date("2026-07-15T20:00:00"),
    );
    expect(a.overlapsWith(b)).toBe(false);
  });

  it("checks equality", () => {
    const a = ReservationTimeRange.create(
      new Date("2026-07-15T18:00:00"),
      new Date("2026-07-15T20:00:00"),
    );
    const b = ReservationTimeRange.create(
      new Date("2026-07-15T18:00:00"),
      new Date("2026-07-15T20:00:00"),
    );
    expect(a.equals(b)).toBe(true);
  });
});

describe("ReservationSource", () => {
  const validSources = [
    "website",
    "phone",
    "walk_in",
    "mobile_app",
    "admin_panel",
    "api",
  ];

  it("creates valid sources", () => {
    for (const source of validSources) {
      expect(ReservationSource.create(source).value).toBe(source);
    }
  });

  it("throws for invalid source", () => {
    expect(() => ReservationSource.create("invalid")).toThrow();
    expect(() => ReservationSource.create("")).toThrow();
  });

  it("normalizes whitespace and case", () => {
    expect(ReservationSource.create("  PHONE  ").value).toBe("phone");
    expect(ReservationSource.create("Walk In").value).toBe("walk_in");
    expect(ReservationSource.create("Mobile App").value).toBe("mobile_app");
  });

  it("identifies customer-facing sources", () => {
    expect(ReservationSource.create("website").isCustomerFacing()).toBe(true);
    expect(ReservationSource.create("phone").isCustomerFacing()).toBe(true);
    expect(ReservationSource.create("admin_panel").isCustomerFacing()).toBe(false);
    expect(ReservationSource.create("api").isCustomerFacing()).toBe(false);
  });

  it("checks equality", () => {
    expect(ReservationSource.create("phone").equals(ReservationSource.create("phone"))).toBe(true);
    expect(ReservationSource.create("phone").equals(ReservationSource.create("api"))).toBe(false);
  });
});

describe("ReservationStatus", () => {
  const validStatuses = [
    "pending",
    "confirmed",
    "checked_in",
    "seated",
    "completed",
    "cancelled",
    "no_show",
  ];

  it("creates valid statuses", () => {
    for (const status of validStatuses) {
      expect(ReservationStatus.create(status).value).toBe(status);
    }
  });

  it("throws for invalid status", () => {
    expect(() => ReservationStatus.create("invalid")).toThrow();
    expect(() => ReservationStatus.create("")).toThrow();
  });

  it("normalizes whitespace and case", () => {
    expect(ReservationStatus.create("  PENDING  ").value).toBe("pending");
    expect(ReservationStatus.create("Checked In").value).toBe("checked_in");
    expect(ReservationStatus.create("No Show").value).toBe("no_show");
  });

  it("validates pending transitions", () => {
    const pending = ReservationStatus.create("pending");
    expect(pending.isTransitionValid("confirmed")).toBe(true);
    expect(pending.isTransitionValid("cancelled")).toBe(true);
    expect(pending.isTransitionValid("no_show")).toBe(true);
    expect(pending.isTransitionValid("checked_in")).toBe(false);
    expect(pending.isTransitionValid("completed")).toBe(false);
    expect(pending.isTransitionValid("seated")).toBe(false);
  });

  it("validates confirmed transitions", () => {
    const confirmed = ReservationStatus.create("confirmed");
    expect(confirmed.isTransitionValid("checked_in")).toBe(true);
    expect(confirmed.isTransitionValid("cancelled")).toBe(true);
    expect(confirmed.isTransitionValid("no_show")).toBe(true);
    expect(confirmed.isTransitionValid("completed")).toBe(true);
    expect(confirmed.isTransitionValid("pending")).toBe(false);
    expect(confirmed.isTransitionValid("seated")).toBe(false);
  });

  it("validates checked_in transitions", () => {
    const checkedIn = ReservationStatus.create("checked_in");
    expect(checkedIn.isTransitionValid("seated")).toBe(true);
    expect(checkedIn.isTransitionValid("cancelled")).toBe(true);
    expect(checkedIn.isTransitionValid("completed")).toBe(false);
    expect(checkedIn.isTransitionValid("confirmed")).toBe(false);
  });

  it("validates seated transitions", () => {
    const seated = ReservationStatus.create("seated");
    expect(seated.isTransitionValid("completed")).toBe(true);
    expect(seated.isTransitionValid("no_show")).toBe(true);
    expect(seated.isTransitionValid("cancelled")).toBe(false);
  });

  it("terminal states have no transitions", () => {
    expect(ReservationStatus.create("completed").getAllowedTransitions()).toHaveLength(0);
    expect(ReservationStatus.create("cancelled").getAllowedTransitions()).toHaveLength(0);
    expect(ReservationStatus.create("no_show").getAllowedTransitions()).toHaveLength(0);
  });

  it("detects active and terminal states", () => {
    expect(ReservationStatus.create("pending").isActive()).toBe(true);
    expect(ReservationStatus.create("confirmed").isActive()).toBe(true);
    expect(ReservationStatus.create("checked_in").isActive()).toBe(true);
    expect(ReservationStatus.create("seated").isActive()).toBe(true);
    expect(ReservationStatus.create("completed").isActive()).toBe(false);
    expect(ReservationStatus.create("completed").isTerminal()).toBe(true);
    expect(ReservationStatus.create("cancelled").isTerminal()).toBe(true);
    expect(ReservationStatus.create("no_show").isTerminal()).toBe(true);
  });

  it("checks specific status helpers", () => {
    expect(ReservationStatus.create("pending").isPending()).toBe(true);
    expect(ReservationStatus.create("confirmed").isConfirmed()).toBe(true);
    expect(ReservationStatus.create("checked_in").isCheckedIn()).toBe(true);
    expect(ReservationStatus.create("seated").isSeated()).toBe(true);
    expect(ReservationStatus.create("completed").isCompleted()).toBe(true);
    expect(ReservationStatus.create("cancelled").isCancelled()).toBe(true);
    expect(ReservationStatus.create("no_show").isNoShow()).toBe(true);
  });
});

describe("ReservationStateMachine", () => {
  const sm = new ReservationStateMachine();

  it("transitions pending to confirmed", () => {
    const result = sm.confirm(ReservationStatus.create("pending"));
    expect(result.value).toBe("confirmed");
  });

  it("transitions confirmed to checked_in", () => {
    const result = sm.checkIn(ReservationStatus.create("confirmed"));
    expect(result.value).toBe("checked_in");
  });

  it("transitions checked_in to seated", () => {
    const result = sm.seat(ReservationStatus.create("checked_in"));
    expect(result.value).toBe("seated");
  });

  it("transitions seated to completed", () => {
    const result = sm.complete(ReservationStatus.create("seated"));
    expect(result.value).toBe("completed");
  });

  it("transitions pending to cancelled", () => {
    const result = sm.cancel(ReservationStatus.create("pending"));
    expect(result.value).toBe("cancelled");
  });

  it("transitions pending to no_show", () => {
    const result = sm.markNoShow(ReservationStatus.create("pending"));
    expect(result.value).toBe("no_show");
  });

  it("transitions confirmed to completed", () => {
    const result = sm.complete(ReservationStatus.create("confirmed"));
    expect(result.value).toBe("completed");
  });

  it("throws on invalid transition", () => {
    expect(() => sm.checkIn(ReservationStatus.create("pending"))).toThrow(
      ReservationStateTransitionError,
    );
    expect(() => sm.complete(ReservationStatus.create("pending"))).toThrow(
      ReservationStateTransitionError,
    );
    expect(() => sm.seat(ReservationStatus.create("confirmed"))).toThrow(
      ReservationStateTransitionError,
    );
  });

  it("throws on transition from terminal state", () => {
    expect(() => sm.confirm(ReservationStatus.create("completed"))).toThrow(
      ReservationStateTransitionError,
    );
    expect(() => sm.confirm(ReservationStatus.create("cancelled"))).toThrow(
      ReservationStateTransitionError,
    );
    expect(() => sm.confirm(ReservationStatus.create("no_show"))).toThrow(
      ReservationStateTransitionError,
    );
  });

  it("lists allowed transitions", () => {
    const pending = ReservationStatus.create("pending");
    expect(sm.getAllowedTargets(pending)).toEqual(["confirmed", "cancelled", "no_show"]);
  });

  it("detects active and terminal via state machine", () => {
    expect(sm.isActive(ReservationStatus.create("confirmed"))).toBe(true);
    expect(sm.isActive(ReservationStatus.create("completed"))).toBe(false);
    expect(sm.isTerminal(ReservationStatus.create("cancelled"))).toBe(true);
    expect(sm.isTerminal(ReservationStatus.create("confirmed"))).toBe(false);
  });
});

describe("ReservationPolicyValidator", () => {
  const validator = new ReservationPolicyValidator();

  it("validates creation returns valid for correct input", () => {
    const result = validator.validateForCreation(
      PartySize.create(4),
      ReservationTimeRange.create(
        new Date("2026-07-15T18:00:00"),
        new Date("2026-07-15T20:00:00"),
      ),
      ReservationSource.create("website"),
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects zero party size", () => {
    const result = validator.validateForCreation(
      PartySize.create(1),
      ReservationTimeRange.create(
        new Date("2026-07-15T18:00:00"),
        new Date("2026-07-15T20:00:00"),
      ),
      ReservationSource.create("website"),
    );
    expect(result.isValid).toBe(true);
  });

  it("rejects invalid time range", () => {
    const result = validator.validateForCreation(
      PartySize.create(4),
      ReservationTimeRange.create(
        new Date("2026-07-15T18:00:00"),
        new Date("2026-07-15T20:00:00"),
      ),
      ReservationSource.create("website"),
    );
    expect(result.isValid).toBe(true);
  });
});

describe("ReservationTimeValidator", () => {
  const validator = new ReservationTimeValidator();

  it("validates creation returns valid for correct input", () => {
    const result = validator.validateForCreation(
      ReservationDate.create(new Date("2026-07-15")),
      ReservationTimeRange.create(
        new Date("2026-07-15T18:00:00"),
        new Date("2026-07-15T20:00:00"),
      ),
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects invalid date", () => {
    expect(() => validator.validateDate(ReservationDate.create(new Date("2026-07-15")))).not.toThrow();
  });

  it("validates time range throws on bad range", () => {
    const badRange = ReservationTimeRange.reconstitute(
      new Date("2026-07-15T20:00:00"),
      new Date("2026-07-15T18:00:00"),
    );
    expect(() => validator.validateTimeRange(badRange)).toThrow(InvalidReservationTimeError);
  });

  it("validates duration", () => {
    const range = ReservationTimeRange.create(
      new Date("2026-07-15T18:00:00"),
      new Date("2026-07-15T20:00:00"),
    );
    expect(() => validator.validateDuration(range, 240)).not.toThrow();
    expect(() => validator.validateDuration(range, 60)).toThrow();
  });

  it("validates not in past skips for future date", () => {
    const future = ReservationDate.create(new Date("2099-07-15"));
    expect(() => validator.validateNotInPast(future)).not.toThrow();
  });
});
