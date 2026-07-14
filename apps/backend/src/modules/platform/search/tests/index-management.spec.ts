import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { SearchIndex } from "../SearchIndex.js";
import type { SearchIndexConfig, SearchProviderConfig } from "../types.js";

const defaultConfig: SearchProviderConfig = {
  type: "database",
  indexPrefix: "tf_",
  defaultLimit: 20,
  maxLimit: 100,
};

function createTestIndex(name: string, overrides?: Partial<SearchIndexConfig>): SearchIndexConfig {
  return {
    name,
    settings: { numberOfShards: 1, numberOfReplicas: 0 },
    mapping: [
      { name: "name", type: "text", searchable: true },
      { name: "status", type: "keyword", filterable: true },
    ],
    version: 1,
    ...overrides,
  };
}

describe("SearchIndex", () => {
  let indexManager: SearchIndex;

  beforeEach(() => {
    indexManager = new SearchIndex(defaultConfig);
  });

  it("creates an index", () => {
    assert.equal(indexManager.create(createTestIndex("restaurants")), true);
    assert.equal(indexManager.exists("restaurants"), true);
  });

  it("applies prefix on creation", () => {
    indexManager.create(createTestIndex("menus"));
    assert.equal(indexManager.exists("tf_menus"), true);
    assert.equal(indexManager.exists("menus"), true);
  });

  it("throws when creating duplicate index", () => {
    indexManager.create(createTestIndex("dup"));
    assert.throws(
      () => indexManager.create(createTestIndex("dup")),
      /already exists/,
    );
  });

  it("deletes an index", () => {
    indexManager.create(createTestIndex("delete-me"));
    assert.equal(indexManager.delete("delete-me"), true);
    assert.equal(indexManager.exists("delete-me"), false);
  });

  it("returns false when deleting non-existent index", () => {
    assert.equal(indexManager.delete("nope"), false);
  });

  it("rebuilds an index and increments version", () => {
    indexManager.create(createTestIndex("rebuild-me"));
    const before = indexManager.getVersion("rebuild-me");
    indexManager.rebuild("rebuild-me");
    const after = indexManager.getVersion("rebuild-me");
    assert.equal(after, (before ?? 0) + 1);
  });

  it("throws when rebuilding non-existent index", () => {
    assert.throws(
      () => indexManager.rebuild("nope"),
      /not found/,
    );
  });

  it("refreshes an index", () => {
    indexManager.create(createTestIndex("refresh-me"));
    assert.equal(indexManager.refresh("refresh-me"), true);
  });

  it("throws when refreshing non-existent index", () => {
    assert.throws(
      () => indexManager.refresh("nope"),
      /not found/,
    );
  });

  it("gets index config", () => {
    indexManager.create(createTestIndex("get-me"));
    const config = indexManager.get("get-me");
    assert.notEqual(config, null);
    assert.equal(config!.name, "tf_get-me");
    assert.equal(config!.mapping.length, 2);
  });

  it("returns null for non-existent index", () => {
    assert.equal(indexManager.get("nope"), null);
  });

  it("lists indexes with prefix", () => {
    indexManager.create(createTestIndex("a"));
    indexManager.create(createTestIndex("b"));
    const list = indexManager.list();
    assert.equal(list.length, 2);
    assert.ok(list.includes("tf_a"));
    assert.ok(list.includes("tf_b"));
  });

  it("checks existence", () => {
    indexManager.create(createTestIndex("exists-test"));
    assert.equal(indexManager.exists("exists-test"), true);
    assert.equal(indexManager.exists("nope"), false);
  });

  it("counts indexes", () => {
    assert.equal(indexManager.count(), 0);
    indexManager.create(createTestIndex("a"));
    assert.equal(indexManager.count(), 1);
    indexManager.create(createTestIndex("b"));
    assert.equal(indexManager.count(), 2);
  });

  it("clears all indexes", () => {
    indexManager.create(createTestIndex("a"));
    indexManager.create(createTestIndex("b"));
    indexManager.clear();
    assert.equal(indexManager.count(), 0);
  });

  it("adds mapping to existing index", () => {
    indexManager.create(createTestIndex("add-mapping"));
    indexManager.addMapping("add-mapping", { name: "price", type: "float", filterable: true });
    const config = indexManager.get("add-mapping");
    assert.equal(config!.mapping.length, 3);
  });

  it("throws when adding mapping to non-existent index", () => {
    assert.throws(
      () => indexManager.addMapping("nope", { name: "x", type: "text" }),
      /not found/,
    );
  });
});
