const MAX_LENGTH = 500;

export class StorageKey {
  private constructor(public readonly value: string) {}

  static create(value: string): StorageKey {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error("Storage key cannot be empty");
    }

    if (trimmed.length > MAX_LENGTH) {
      throw new Error(`Storage key cannot exceed ${MAX_LENGTH} characters`);
    }

    return new StorageKey(trimmed);
  }

  static reconstitute(value: string): StorageKey {
    return new StorageKey(value);
  }

  equals(other: StorageKey): boolean {
    return this.value === other.value;
  }
}
