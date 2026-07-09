const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class OpeningPeriod {
  private constructor(
    public readonly openTime: string,
    public readonly closeTime: string,
  ) {
    const openMinutes = this.toMinutes(openTime);
    const closeMinutes = this.toMinutes(closeTime);
    if (openMinutes >= closeMinutes) {
      throw new Error(
        `Open time (${openTime}) must be before close time (${closeTime})`,
      );
    }
  }

  static create(openTime: string, closeTime: string): OpeningPeriod {
    if (!TIME_REGEX.test(openTime)) {
      throw new Error(`openTime must be in HH:MM format, got '${openTime}'`);
    }
    if (!TIME_REGEX.test(closeTime)) {
      throw new Error(`closeTime must be in HH:MM format, got '${closeTime}'`);
    }
    return new OpeningPeriod(openTime, closeTime);
  }

  static reconstitute(openTime: string, closeTime: string): OpeningPeriod {
    return new OpeningPeriod(openTime, closeTime);
  }

  equals(other: OpeningPeriod): boolean {
    return this.openTime === other.openTime && this.closeTime === other.closeTime;
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }
}
