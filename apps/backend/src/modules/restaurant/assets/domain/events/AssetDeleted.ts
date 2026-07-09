export class AssetDeleted {
  constructor(
    public readonly assetId: string,
    public readonly restaurantId: string,
    public readonly storageKey: string,
  ) {}
}
