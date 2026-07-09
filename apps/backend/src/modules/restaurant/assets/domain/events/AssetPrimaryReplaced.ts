export class AssetPrimaryReplaced {
  constructor(
    public readonly restaurantId: string,
    public readonly assetType: string,
    public readonly previousAssetId: string | null,
    public readonly newAssetId: string,
  ) {}
}
