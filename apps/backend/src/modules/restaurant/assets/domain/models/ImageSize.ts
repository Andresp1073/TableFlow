const MIN_DIMENSION = 0;
const MAX_DIMENSION = 10000;

export class ImageSize {
  private constructor(
    public readonly width: number,
    public readonly height: number,
  ) {}

  static create(width: number, height: number): ImageSize {
    if (!Number.isInteger(width) || width < MIN_DIMENSION || width > MAX_DIMENSION) {
      throw new Error(`Width must be an integer between ${MIN_DIMENSION} and ${MAX_DIMENSION}`);
    }

    if (!Number.isInteger(height) || height < MIN_DIMENSION || height > MAX_DIMENSION) {
      throw new Error(`Height must be an integer between ${MIN_DIMENSION} and ${MAX_DIMENSION}`);
    }

    return new ImageSize(width, height);
  }

  static reconstitute(width: number, height: number): ImageSize {
    return new ImageSize(width, height);
  }

  equals(other: ImageSize): boolean {
    return this.width === other.width && this.height === other.height;
  }
}
