import { MIN_TIME, MAX_TIME } from "./OpeningTime.js";

export class ClosingTime {
  private constructor(public readonly value: number) {}

  static create(value: number): ClosingTime {
    if (!Number.isInteger(value) || value < MIN_TIME || value > MAX_TIME) {
      throw new Error(`ClosingTime must be an integer between ${MIN_TIME} and ${MAX_TIME}, got ${value}`);
    }
    return new ClosingTime(value);
  }

  static reconstitute(value: number): ClosingTime {
    return new ClosingTime(value);
  }

  equals(other: ClosingTime): boolean {
    return this.value === other.value;
  }

  toString(): string {
    const hours = Math.floor(this.value / 60).toString().padStart(2, "0");
    const minutes = (this.value % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  static fromString(time: string): ClosingTime {
    const match = /^(\d{1,2}):(\d{2})$/.exec(time);
    if (!match) {
      throw new Error(`Invalid time format '${time}'. Expected HH:MM`);
    }
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return ClosingTime.create(hours * 60 + minutes);
  }
}
