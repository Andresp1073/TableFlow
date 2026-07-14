import type { StorageObject } from "./types.js";

export function computeChecksum(content: string): string {
  let hash = 0;

  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16).padStart(8, "0");
}

export function generateVersion(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);

  return `v${timestamp}${random}`;
}

export function generateObjectId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);

  return `obj_${timestamp}${random}`;
}

export function buildStorageObject(overrides: Partial<StorageObject> = {}): StorageObject {
  const now = new Date();
  const content = overrides.checksum ? "" : "test-content";

  return {
    id: generateObjectId(),
    path: "test/path.txt",
    bucket: "tableflow",
    contentType: "text/plain",
    contentLength: content.length,
    checksum: computeChecksum(content),
    version: generateVersion(),
    metadata: {},
    policy: overrides.policy ?? "private",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
