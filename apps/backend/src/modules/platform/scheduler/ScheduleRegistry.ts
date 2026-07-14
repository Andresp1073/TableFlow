import type { Schedule, ScheduleRegistry as ScheduleRegistryInterface, ScheduleState, TriggerType } from "./types.js";

export class ScheduleRegistry implements ScheduleRegistryInterface {
  private readonly byName = new Map<string, Schedule>();
  private readonly byId = new Map<string, Schedule>();

  register(schedule: Schedule): void {
    this.byName.set(schedule.name, schedule);
    this.byId.set(schedule.id, schedule);
  }

  unregister(name: string): boolean {
    const schedule = this.byName.get(name);
    if (!schedule) {
      return false;
    }
    this.byName.delete(name);
    this.byId.delete(schedule.id);
    return true;
  }

  get(name: string): Schedule | null {
    return this.byName.get(name) ?? null;
  }

  getById(id: string): Schedule | null {
    return this.byId.get(id) ?? null;
  }

  getAll(): Schedule[] {
    return Array.from(this.byName.values());
  }

  getByState(state: ScheduleState): Schedule[] {
    return Array.from(this.byName.values()).filter((s) => s.state === state);
  }

  getByTriggerType(type: TriggerType): Schedule[] {
    return Array.from(this.byName.values()).filter((s) => s.trigger.type === type);
  }

  update(schedule: Schedule): void {
    schedule.updatedAt = new Date();
    this.byName.set(schedule.name, schedule);
    this.byId.set(schedule.id, schedule);
  }

  clear(): void {
    this.byName.clear();
    this.byId.clear();
  }

  count(): number {
    return this.byName.size;
  }
}
