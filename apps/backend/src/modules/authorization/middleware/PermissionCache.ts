export interface CachedPermissions {
  permissions: Set<string>;
  roleCodes: Set<string>;
}

const requestCaches = new WeakMap<object, CachedPermissions>();

export function getCache(key: object): CachedPermissions | undefined {
  return requestCaches.get(key);
}

export function setCache(key: object, data: CachedPermissions): void {
  requestCaches.set(key, data);
}

export function createCachedPermissions(): CachedPermissions {
  return { permissions: new Set<string>(), roleCodes: new Set<string>() };
}

