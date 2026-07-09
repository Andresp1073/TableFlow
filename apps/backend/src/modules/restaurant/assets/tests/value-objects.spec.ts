import { describe, it, expect } from "vitest";
import { AssetType } from "../domain/models/AssetType.js";
import { MimeType } from "../domain/models/MimeType.js";
import { StorageKey } from "../domain/models/StorageKey.js";
import { ImageSize } from "../domain/models/ImageSize.js";

describe("AssetType", () => {
  it("creates from valid type", () => {
    const t = AssetType.create("logo");
    expect(t.value).toBe("logo");
  });

  it("normalizes hyphens to underscores", () => {
    const t = AssetType.create("menu-image");
    expect(t.value).toBe("menu_image");
  });

  it("is case insensitive", () => {
    const t = AssetType.create("COVER");
    expect(t.value).toBe("cover");
  });

  it("throws for invalid type", () => {
    expect(() => AssetType.create("invalid")).toThrow();
  });
});

describe("MimeType", () => {
  it("creates from valid mime type", () => {
    const m = MimeType.create("image/jpeg");
    expect(m.value).toBe("image/jpeg");
  });

  it("rejects empty", () => {
    expect(() => MimeType.create("")).toThrow();
  });

  it("isAllowed returns true for known types", () => {
    expect(MimeType.isAllowed("image/jpeg")).toBe(true);
    expect(MimeType.isAllowed("image/png")).toBe(true);
    expect(MimeType.isAllowed("application/pdf")).toBe(true);
  });

  it("isAllowed returns false for unknown types", () => {
    expect(MimeType.isAllowed("text/plain")).toBe(false);
    expect(MimeType.isAllowed("video/mp4")).toBe(false);
  });

  it("isImage returns true for image types", () => {
    expect(MimeType.create("image/jpeg").isImage()).toBe(true);
    expect(MimeType.create("application/pdf").isImage()).toBe(false);
  });
});

describe("StorageKey", () => {
  it("creates from valid key", () => {
    const k = StorageKey.create("rest-1/logo/abc.jpg");
    expect(k.value).toBe("rest-1/logo/abc.jpg");
  });

  it("rejects empty", () => {
    expect(() => StorageKey.create("")).toThrow();
  });
});

describe("ImageSize", () => {
  it("creates from valid dimensions", () => {
    const s = ImageSize.create(1920, 1080);
    expect(s.width).toBe(1920);
    expect(s.height).toBe(1080);
  });

  it("throws for negative", () => {
    expect(() => ImageSize.create(-1, 100)).toThrow();
  });

  it("throws for overflow", () => {
    expect(() => ImageSize.create(10001, 100)).toThrow();
  });
});
