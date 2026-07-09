export class AssetUploaded {
  constructor(
    public readonly assetId: string,
    public readonly restaurantId: string,
    public readonly type: string,
    public readonly fileName: string,
  ) {}
}
