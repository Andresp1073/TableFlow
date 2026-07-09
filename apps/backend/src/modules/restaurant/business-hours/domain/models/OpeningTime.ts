export const MIN_TIME = 0;
export const MAX_TIME = 1439;

export class OpeningTime {
  private constructor(public readonly value: number) {}

  static create(value: number): OpeningTime {
    if (!Number.isInteger(value) || value < MIN_TIME || value > MAX_TIME) {
      throw new Error(`OpeningTime must be an integer between ${MIN_TIME} and ${MAX_TIME}, got ${value}`);
    }
    return new OpeningTime(value);
  }

  static reconstitute(value: number): OpeningTime {
    return new OpeningTime(value);
  }

  equals(other: OpeningTime): boolean {
    return this.value === other.value;
  }

  toString(): string {
    const hours = Math.floor(this.value / 60).toString().padStart(2, "0");
    const minutes = (this.value % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  static fromString(time: string): OpeningTime {
    const match = /^(\d{1,2}):(\d{2})$/.exec(time);
    if (!match) {
      throw new Error(`Invalid time format '${time}'. Expected HH:MM`);
    }
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return OpeningTime.create(hours * 60 + minutes);
  }
}
