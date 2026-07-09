const ALLOWED_MIME_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "application/pdf",
  "image/tiff",
];

const MAX_LENGTH = 100;

export class MimeType {
  private constructor(public readonly value: string) {}

  static create(value: string): MimeType {
    const trimmed = value.trim().toLowerCase();

    if (trimmed.length === 0) {
      throw new Error("MIME type cannot be empty");
    }

    if (trimmed.length > MAX_LENGTH) {
      throw new Error(`MIME type cannot exceed ${MAX_LENGTH} characters`);
    }

    return new MimeType(trimmed);
  }

  static reconstitute(value: string): MimeType {
    return new MimeType(value);
  }

  static isAllowed(value: string): boolean {
    return ALLOWED_MIME_TYPES.includes(value.trim().toLowerCase());
  }

  static allowedTypes(): readonly string[] {
    return ALLOWED_MIME_TYPES;
  }

  isImage(): boolean {
    return this.value.startsWith("image/");
  }

  equals(other: MimeType): boolean {
    return this.value === other.value;
  }
}
