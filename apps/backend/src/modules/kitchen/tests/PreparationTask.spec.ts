import { describe, it, expect } from "vitest";
import { PreparationTask, TaskStatus } from "../domain/models/PreparationTask.js";

describe("PreparationTask", () => {
  it("creates a task in Pending status", () => {
    const task = PreparationTask.create({
      id: "task-1",
      ticketId: "ticket-1",
      menuItemId: "item-1",
      menuItemName: "Burger",
      quantity: 2,
      stationId: "grill-1",
      modifiers: ["no onions"],
      estimatedPrepTimeSeconds: 600,
    });
    expect(task.status).toBe(TaskStatus.Pending);
    expect(task.menuItemName).toBe("Burger");
    expect(task.modifiers).toContain("no onions");
  });

  it("starts a task", () => {
    const task = PreparationTask.create({
      id: "task-1",
      ticketId: "ticket-1",
      menuItemId: "item-1",
      menuItemName: "Burger",
      quantity: 1,
      stationId: "grill-1",
      modifiers: [],
      estimatedPrepTimeSeconds: 600,
    });
    const started = task.start();
    expect(started.status).toBe(TaskStatus.InProgress);
    expect(started.startedAt).toBeInstanceOf(Date);
  });

  it("completes a task", () => {
    const task = PreparationTask.create({
      id: "task-1",
      ticketId: "ticket-1",
      menuItemId: "item-1",
      menuItemName: "Fries",
      quantity: 1,
      stationId: "fry-1",
      modifiers: [],
      estimatedPrepTimeSeconds: 300,
    });
    const started = task.start();
    const completed = started.complete();
    expect(completed.status).toBe(TaskStatus.Completed);
    expect(completed.completedAt).toBeInstanceOf(Date);
  });

  it("skips a task", () => {
    const task = PreparationTask.create({
      id: "task-1",
      ticketId: "ticket-1",
      menuItemId: "item-1",
      menuItemName: "Special",
      quantity: 1,
      stationId: "prep-1",
      modifiers: [],
      estimatedPrepTimeSeconds: 120,
    });
    const skipped = task.skip();
    expect(skipped.status).toBe(TaskStatus.Skipped);
  });

  it("rejects starting a completed task", () => {
    const task = PreparationTask.create({
      id: "task-1",
      ticketId: "ticket-1",
      menuItemId: "item-1",
      menuItemName: "Burger",
      quantity: 1,
      stationId: "grill-1",
      modifiers: [],
      estimatedPrepTimeSeconds: 600,
    });
    const started = task.start();
    const completed = started.complete();
    expect(() => completed.start()).toThrow();
  });

  it("rejects completing a non-started task", () => {
    const task = PreparationTask.create({
      id: "task-1",
      ticketId: "ticket-1",
      menuItemId: "item-1",
      menuItemName: "Burger",
      quantity: 1,
      stationId: "grill-1",
      modifiers: [],
      estimatedPrepTimeSeconds: 600,
    });
    expect(() => task.complete()).toThrow();
  });

  it("calculates elapsed seconds", () => {
    const task = PreparationTask.create({
      id: "task-1",
      ticketId: "ticket-1",
      menuItemId: "item-1",
      menuItemName: "Burger",
      quantity: 1,
      stationId: "grill-1",
      modifiers: [],
      estimatedPrepTimeSeconds: 600,
    });
    expect(task.getElapsedSeconds()).toBeNull();
    const started = task.start();
    expect(started.getElapsedSeconds()).toBeGreaterThanOrEqual(0);
  });

  it("detects overdue tasks", () => {
    const task = PreparationTask.reconstitute({
      id: "task-1",
      ticketId: "ticket-1",
      menuItemId: "item-1",
      menuItemName: "Burger",
      quantity: 1,
      stationId: "grill-1",
      modifiers: [],
      status: TaskStatus.InProgress,
      startedAt: new Date(Date.now() - 600000),
      completedAt: null,
      estimatedPrepTimeSeconds: 60,
      notes: undefined,
    });
    expect(task.isOverdue()).toBe(true);
  });
});
