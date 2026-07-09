export const ASSET_TYPES = [
  "logo",
  "cover",
  "gallery",
  "menu_image",
  "qr_image",
  "document",
  "brand_asset",
] as const;

export type AssetTypeValue = typeof ASSET_TYPES[number];

export class AssetType {
  private constructor(public readonly value: AssetTypeValue) {}

  static create(value: string): AssetType {
    const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_") as AssetTypeValue;

    if (!ASSET_TYPES.includes(normalized)) {
      throw new Error(
        `Invalid asset type "${value}". Allowed: ${ASSET_TYPES.join(", ")}`,
      );
    }

    return new AssetType(normalized);
  }

  static reconstitute(value: string): AssetType {
    return new AssetType(value as AssetTypeValue);
  }

  equals(other: AssetType): boolean {
    return this.value === other.value;
  }
}
