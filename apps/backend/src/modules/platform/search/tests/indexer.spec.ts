import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { SearchIndexer } from "../SearchIndexer.js";
import { SearchIndex } from "../SearchIndex.js";
import { buildSearchDocument } from "../SearchDocument.js";
import type { SearchProviderConfig } from "../types.js";

const config: SearchProviderConfig = {
  type: "database",
  indexPrefix: "tf_",
  defaultLimit: 20,
  maxLimit: 100,
};

function createIndex(name: string): SearchIndex {
  const idx = new SearchIndex(config);
  idx.create({
    name,
    settings: { numberOfShards: 1, numberOfReplicas: 0 },
    mapping: [{ name: "name", type: "text", searchable: true }],
    version: 1,
  });
  return idx;
}

describe("SearchIndexer", () => {
  let indexManager: SearchIndex;
  let indexer: SearchIndexer;

  beforeEach(() => {
    indexManager = createIndex("test-index");
    indexer = new SearchIndexer(indexManager);
  });

  it("indexes a document", () => {
    const doc = buildSearchDocument("user", { name: "Alice", age: 30 });
    const result = indexer.index("test-index", doc);
    assert.equal(result.success, true);
    assert.equal(result.documentId, doc.id);
    assert.equal(result.version, 1);
  });

  it("throws when indexing into non-existent index", () => {
    const doc = buildSearchDocument("user", { name: "Bob" });
    assert.throws(
      () => indexer.index("nope", doc),
      /not found/,
    );
  });

  it("retrieves an indexed document", () => {
    const doc = buildSearchDocument("user", { name: "Charlie" });
    indexer.index("test-index", doc);
    const retrieved = indexer.getDocument("test-index", doc.id);
    assert.notEqual(retrieved, null);
    assert.equal(retrieved!.payload["name"], "Charlie");
  });

  it("updates a document", () => {
    const doc = buildSearchDocument("user", { name: "Diana", age: 25 });
    indexer.index("test-index", doc);
    const result = indexer.update("test-index", { id: doc.id, payload: { age: 26 } });
    assert.equal(result.success, true);
    assert.equal(result.version, 2);

    const updated = indexer.getDocument("test-index", doc.id);
    assert.equal(updated!.payload["age"], 26);
    assert.equal(updated!.payload["name"], "Diana");
  });

  it("throws when updating non-existent document", () => {
    assert.throws(
      () => indexer.update("test-index", { id: "nope", payload: {} }),
      /not found/,
    );
  });

  it("deletes a document", () => {
    const doc = buildSearchDocument("user", { name: "Eve" });
    indexer.index("test-index", doc);
    const result = indexer.delete("test-index", doc.id);
    assert.equal(result.success, true);
    assert.equal(indexer.getDocument("test-index", doc.id), null);
  });

  it("throws when deleting non-existent document", () => {
    assert.throws(
      () => indexer.delete("test-index", "nope"),
      /not found/,
    );
  });

  it("lists all documents in an index", () => {
    indexer.index("test-index", buildSearchDocument("user", { name: "A" }));
    indexer.index("test-index", buildSearchDocument("user", { name: "B" }));
    indexer.index("test-index", buildSearchDocument("user", { name: "C" }));
    assert.equal(indexer.listDocuments("test-index").length, 3);
  });

  it("counts documents in an index", () => {
    assert.equal(indexer.countDocuments("test-index"), 0);
    indexer.index("test-index", buildSearchDocument("user", { name: "X" }));
    assert.equal(indexer.countDocuments("test-index"), 1);
  });

  it("bulk indexes documents", () => {
    const docs = [
      buildSearchDocument("user", { name: "U1" }),
      buildSearchDocument("user", { name: "U2" }),
      buildSearchDocument("user", { name: "U3" }),
    ];
    const result = indexer.bulkIndex("test-index", docs);
    assert.equal(result.successCount, 3);
    assert.equal(result.failureCount, 0);
    assert.equal(indexer.countDocuments("test-index"), 3);
  });

  it("bulk index reports failures", () => {
    const docs = [
      buildSearchDocument("user", { name: "Good" }),
    ];
    indexer.clearIndex("test-index");
    indexManager.delete("test-index");

    const result = indexer.bulkIndex("test-index", docs);
    assert.equal(result.successCount, 0);
    assert.equal(result.failureCount, 1);
  });

  it("clears all documents in an index", () => {
    indexer.index("test-index", buildSearchDocument("user", { name: "A" }));
    indexer.index("test-index", buildSearchDocument("user", { name: "B" }));
    indexer.clearIndex("test-index");
    assert.equal(indexer.countDocuments("test-index"), 0);
  });

  it("clears all indexes", () => {
    indexManager.create({ name: "idx2", settings: {}, mapping: [], version: 1 });
    indexer.index("test-index", buildSearchDocument("user", { name: "A" }));
    indexer.index("idx2", buildSearchDocument("user", { name: "B" }));
    indexer.clearAll();
    assert.equal(indexer.countDocuments("test-index"), 0);
    assert.equal(indexer.countDocuments("idx2"), 0);
  });

  it("resolves index name with prefix", () => {
    const doc = buildSearchDocument("user", { name: "Prefixed" });
    const result = indexer.index("tf_test-index", doc);
    assert.equal(result.success, true);
  });
});
