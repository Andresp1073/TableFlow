export interface AssetUrlResolver {
  resolve(storageKey: string): string;
}
