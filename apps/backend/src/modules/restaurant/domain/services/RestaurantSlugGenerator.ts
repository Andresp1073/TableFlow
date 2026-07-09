export interface RestaurantSlugGenerator {
  fromName(name: string): Promise<string>;
  ensureUnique(candidate: string): Promise<string>;
}
