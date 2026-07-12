const QR_REGEX = /^[A-Za-z0-9_-]+$/;

export class QrIdentifier {
  private constructor(public readonly value: string) {}

  static create(value: string): QrIdentifier {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error("QR identifier must not be empty");
    }
    if (trimmed.length > 100) {
      throw new Error("QR identifier must not exceed 100 characters");
    }
    if (!QR_REGEX.test(trimmed)) {
      throw new Error(
        "QR identifier must contain only alphanumeric characters, underscores, and hyphens",
      );
    }
    return new QrIdentifier(trimmed);
  }

  static reconstitute(value: string): QrIdentifier {
    return new QrIdentifier(value);
  }

  equals(other: QrIdentifier): boolean {
    return this.value === other.value;
  }
}
