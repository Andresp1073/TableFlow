import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReservationStateMachineCoordinator } from "../../engine/state-machine/ReservationStateMachineCoordinator.js";
import { ReservationStatus } from "../../domain/models/ReservationStatus.js";
import { ReservationStateTransitionError } from "../../errors/ReservationStateTransitionError.js";
import { ReservationPolicyEvaluator } from "../../engine/policy/ReservationPolicyEvaluator.js";
import { PartySize } from "../../domain/models/PartySize.js";
import { ReservationTimeRange } from "../../domain/models/ReservationTimeRange.js";
import { ReservationSource } from "../../domain/models/ReservationSource.js";

describe("ReservationStateMachineCoordinator", () => {
  const coordinator = new ReservationStateMachineCoordinator();

  it("delegates confirm transition", () => {
    const result = coordinator.confirm(ReservationStatus.create("pending"));
    expect(result.value).toBe("confirmed");
  });

  it("delegates cancel transition", () => {
    const result = coordinator.cancel(ReservationStatus.create("pending"));
    expect(result.value).toBe("cancelled");
  });

  it("delegates checkIn transition", () => {
    const result = coordinator.checkIn(ReservationStatus.create("confirmed"));
    expect(result.value).toBe("checked_in");
  });

  it("delegates seat transition", () => {
    const result = coordinator.seat(ReservationStatus.create("checked_in"));
    expect(result.value).toBe("seated");
  });

  it("delegates complete transition", () => {
    const result = coordinator.complete(ReservationStatus.create("seated"));
    expect(result.value).toBe("completed");
  });

  it("delegates markNoShow transition", () => {
    const result = coordinator.markNoShow(ReservationStatus.create("pending"));
    expect(result.value).toBe("no_show");
  });

  it("requires valid transition and throws on invalid", () => {
    const completed = ReservationStatus.create("completed");
    expect(() => coordinator.requireTransition(completed, "confirmed")).toThrow(
      ReservationStateTransitionError,
    );
  });

  it("requires valid transition and succeeds on valid", () => {
    const pending = ReservationStatus.create("pending");
    const result = coordinator.requireTransition(pending, "confirmed");
    expect(result.value).toBe("confirmed");
  });

  it("checks canTransition", () => {
    expect(coordinator.canTransition(ReservationStatus.create("pending"), "confirmed")).toBe(true);
    expect(coordinator.canTransition(ReservationStatus.create("pending"), "seated")).toBe(false);
  });

  it("lists allowed targets", () => {
    const targets = coordinator.getAllowedTargets(ReservationStatus.create("pending"));
    expect(targets).toEqual(["confirmed", "cancelled", "no_show"]);
  });

  it("detects active and terminal states", () => {
    expect(coordinator.isActive(ReservationStatus.create("confirmed"))).toBe(true);
    expect(coordinator.isActive(ReservationStatus.create("completed"))).toBe(false);
    expect(coordinator.isTerminal(ReservationStatus.create("cancelled"))).toBe(true);
    expect(coordinator.isTerminal(ReservationStatus.create("confirmed"))).toBe(false);
  });
});

describe("ReservationPolicyEvaluator", () => {
  const evaluator = new ReservationPolicyEvaluator();

  it("evaluates valid creation input", () => {
    const result = evaluator.evaluateForCreation(
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

  it("flags large parties with warning", () => {
    const result = evaluator.evaluateForCreation(
      PartySize.create(10),
      ReservationTimeRange.create(
        new Date("2026-07-15T18:00:00"),
        new Date("2026-07-15T20:00:00"),
      ),
      ReservationSource.create("website"),
    );
    expect(result.isValid).toBe(true);
    expect(result.warnings).toContain("Large party requires special handling");
  });

  it("evaluates party size with warning for large parties", () => {
    const result = evaluator.evaluatePartySize(PartySize.create(8));
    expect(result.isValid).toBe(true);
    expect(result.warnings).toContain("Large party requires special handling");
  });

  it("evaluates non-customer-facing source with warning", () => {
    const result = evaluator.evaluateSource(ReservationSource.create("api"));
    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("evaluates customer-facing source without warning", () => {
    const result = evaluator.evaluateSource(ReservationSource.create("website"));
    expect(result.isValid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });
});
