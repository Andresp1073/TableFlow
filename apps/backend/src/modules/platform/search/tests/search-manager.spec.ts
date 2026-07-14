import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { SearchManager } from "../SearchManager.js";
import { SearchIndex } from "../SearchIndex.js";
import { SearchIndexer } from "../SearchIndexer.js";
import { buildSearchDocument } from "../SearchDocument.js";
import { SearchQueryBuilder } from "../SearchQueryBuilder.js";
import type { SearchProviderConfig } from "../types.js";

const config: SearchProviderConfig = {
  type: "database",
  indexPrefix: "tf_",
  defaultLimit: 20,
  maxLimit: 100,
};

describe("SearchManager", () => {
  let indexManager: SearchIndex;
  let indexer: SearchIndexer;
  let searchManager: SearchManager;

  beforeEach(() => {
    indexManager = new SearchIndex(config);
    indexManager.create({
      name: "users",
      settings: { numberOfShards: 1, numberOfReplicas: 0 },
      mapping: [
        { name: "name", type: "text", searchable: true },
        { name: "email", type: "keyword", filterable: true },
        { name: "age", type: "integer", filterable: true, sortable: true },
        { name: "role", type: "keyword", filterable: true },
        { name: "score", type: "float", sortable: true },
      ],
      version: 1,
    });
    indexer = new SearchIndexer(indexManager);
    searchManager = new SearchManager(indexManager, indexer, config);
  });

  function seedData(): void {
    const users = [
      { name: "Alice Smith", email: "alice@example.com", age: 30, role: "admin", score: 95 },
      { name: "Bob Johnson", email: "bob@example.com", age: 25, role: "user", score: 80 },
      { name: "Charlie Brown", email: "charlie@example.com", age: 35, role: "user", score: 75 },
      { name: "Diana Prince", email: "diana@example.com", age: 28, role: "moderator", score: 90 },
      { name: "Eve Wilson", email: "eve@example.com", age: 32, role: "admin", score: 88 },
    ];
    for (const u of users) {
      indexer.index("users", buildSearchDocument("user", u));
    }
  }

  describe("search", () => {
    it("returns all documents when no query filters", async () => {
      seedData();
      const result = await searchManager.search("users", SearchQueryBuilder.create().withQuery("").build());
      assert.equal(result.total, 5);
      assert.equal(result.documents.length, 5);
    });

    it("filters by search query", async () => {
      seedData();
      const result = await searchManager.search("users", SearchQueryBuilder.create().withQuery("alice").build());
      assert.equal(result.total, 1);
      assert.equal(result.documents[0].payload["name"], "Alice Smith");
    });

    it("filters by type", async () => {
      seedData();
      const result = await searchManager.search("users", SearchQueryBuilder.create().withQuery("").withType("user").build());
      assert.equal(result.total, 5);
    });

    it("filters by field value (eq)", async () => {
      seedData();
      const query = SearchQueryBuilder.create()
        .withQuery("")
        .addFilter({ field: "role", operator: "eq", value: "admin" })
        .build();
      const result = await searchManager.search("users", query);
      assert.equal(result.total, 2);
    });

    it("filters by numeric range (gte)", async () => {
      seedData();
      const query = SearchQueryBuilder.create()
        .withQuery("")
        .addFilter({ field: "age", operator: "gte", value: 30 })
        .build();
      const result = await searchManager.search("users", query);
      assert.equal(result.total, 3);
    });

    it("filters by in operator", async () => {
      seedData();
      const query = SearchQueryBuilder.create()
        .withQuery("")
        .addFilter({ field: "role", operator: "in", value: ["admin", "moderator"] })
        .build();
      const result = await searchManager.search("users", query);
      assert.equal(result.total, 3);
    });

    it("filters by exists operator", async () => {
      seedData();
      const query = SearchQueryBuilder.create()
        .withQuery("")
        .addFilter({ field: "email", operator: "exists", value: true })
        .build();
      const result = await searchManager.search("users", query);
      assert.equal(result.total, 5);
    });

    it("filters by not_exists operator", async () => {
      seedData();
      const query = SearchQueryBuilder.create()
        .withQuery("")
        .addFilter({ field: "missing_field", operator: "not_exists", value: true })
        .build();
      const result = await searchManager.search("users", query);
      assert.equal(result.total, 5);
    });

    it("sorts ascending", async () => {
      seedData();
      const query = SearchQueryBuilder.create()
        .withQuery("")
        .withSort("age", "asc")
        .build();
      const result = await searchManager.search("users", query);
      assert.equal(result.documents[0].payload["age"], 25);
    });

    it("sorts descending", async () => {
      seedData();
      const query = SearchQueryBuilder.create()
        .withQuery("")
        .withSort("age", "desc")
        .build();
      const result = await searchManager.search("users", query);
      assert.equal(result.documents[0].payload["age"], 35);
    });

    it("paginates results", async () => {
      seedData();
      const query = SearchQueryBuilder.create()
        .withQuery("")
        .withPagination(0, 2)
        .build();
      const result = await searchManager.search("users", query);
      assert.equal(result.documents.length, 2);
      assert.equal(result.total, 5);
    });

    it("enforces max limit", async () => {
      seedData();
      const query = SearchQueryBuilder.create()
        .withQuery("")
        .withPagination(0, 999)
        .build();
      const result = await searchManager.search("users", query);
      assert.equal(result.documents.length, 5);
    });

    it("returns empty result for non-existent index", async () => {
      const result = await searchManager.search("nope", SearchQueryBuilder.create().withQuery("test").build());
      assert.equal(result.total, 0);
      assert.equal(result.documents.length, 0);
    });
  });

  describe("autocomplete", () => {
    it("returns suggestions based on prefix", async () => {
      seedData();
      const suggestions = await searchManager.autocomplete("users", "ali");
      assert.ok(suggestions.includes("Alice Smith"));
    });

    it("returns empty array for non-existent index", async () => {
      const suggestions = await searchManager.autocomplete("nope", "test");
      assert.equal(suggestions.length, 0);
    });

    it("filters by type", async () => {
      seedData();
      const suggestions = await searchManager.autocomplete("users", "bob", { type: "user" });
      assert.ok(suggestions.includes("Bob Johnson"));
    });

    it("respects size limit", async () => {
      seedData();
      const suggestions = await searchManager.autocomplete("users", "a", { size: 1 });
      assert.equal(suggestions.length, 1);
    });
  });

  describe("facetedSearch", () => {
    it("returns facet counts", async () => {
      seedData();
      const request = SearchQueryBuilder.create()
        .withQuery("")
        .buildFacetedRequest(["role"], { size: 10 });
      const result = await searchManager.facetedSearch("users", request);
      assert.ok(result.facets);
      assert.ok(result.facets["role"]);
      assert.equal(result.facets["role"].length, 3);
    });

    it("returns empty facets for non-existent index", async () => {
      const request = SearchQueryBuilder.create()
        .withQuery("")
        .buildFacetedRequest(["role"]);
      const result = await searchManager.facetedSearch("nope", request);
      assert.equal(result.total, 0);
    });
  });

  describe("index management", () => {
    it("creates an index", async () => {
      const result = await searchManager.createIndex({
        name: "new-index",
        settings: {},
        mapping: [{ name: "title", type: "text", searchable: true }],
        version: 1,
      });
      assert.equal(result, true);
      assert.equal(await searchManager.indexExists("new-index"), true);
    });

    it("deletes an index", async () => {
      await searchManager.createIndex({
        name: "temp-index",
        settings: {},
        mapping: [],
        version: 1,
      });
      assert.equal(await searchManager.deleteIndex("temp-index"), true);
      assert.equal(await searchManager.indexExists("temp-index"), false);
    });

    it("rebuilds an index", async () => {
      await searchManager.createIndex({
        name: "rebuild-idx",
        settings: {},
        mapping: [],
        version: 1,
      });
      assert.equal(await searchManager.rebuildIndex("rebuild-idx"), true);
      const config = await searchManager.getIndex("rebuild-idx");
      assert.equal(config!.version, 2);
    });

    it("refreshes an index", async () => {
      await searchManager.createIndex({
        name: "refresh-idx",
        settings: {},
        mapping: [],
        version: 1,
      });
      assert.equal(await searchManager.refreshIndex("refresh-idx"), true);
    });

    it("lists indexes", async () => {
      await searchManager.createIndex({ name: "idx-a", settings: {}, mapping: [], version: 1 });
      await searchManager.createIndex({ name: "idx-b", settings: {}, mapping: [], version: 1 });
      const list = await searchManager.listIndexes();
      assert.equal(list.length, 3);
      assert.ok(list.includes("tf_users"));
      assert.ok(list.includes("tf_idx-a"));
      assert.ok(list.includes("tf_idx-b"));
    });
  });

  describe("document operations", () => {
    it("indexes a document", async () => {
      const doc = buildSearchDocument("post", { title: "Hello World" });
      const result = await searchManager.indexDocument("users", doc);
      assert.equal(result.success, true);
    });

    it("updates a document", async () => {
      const doc = buildSearchDocument("post", { title: "Original" });
      await searchManager.indexDocument("users", doc);

      const result = await searchManager.updateDocument("users", { id: doc.id, payload: { title: "Updated" } });
      assert.equal(result.success, true);
      assert.equal(result.version, 2);
    });

    it("deletes a document", async () => {
      const doc = buildSearchDocument("post", { title: "Delete Me" });
      await searchManager.indexDocument("users", doc);

      const result = await searchManager.deleteDocument("users", doc.id);
      assert.equal(result.success, true);
    });

    it("bulk indexes documents", async () => {
      const docs = [
        buildSearchDocument("post", { title: "A" }),
        buildSearchDocument("post", { title: "B" }),
        buildSearchDocument("post", { title: "C" }),
      ];
      const result = await searchManager.bulkIndex("users", docs);
      assert.equal(result.successCount, 3);
    });
  });

  describe("filter operators", () => {
    beforeEach(() => {
      seedData();
    });

    it("neq filter", async () => {
      const q = SearchQueryBuilder.create().withQuery("").addFilter({ field: "role", operator: "neq", value: "admin" }).build();
      const r = await searchManager.search("users", q);
      assert.equal(r.total, 3);
    });

    it("lt filter", async () => {
      const q = SearchQueryBuilder.create().withQuery("").addFilter({ field: "age", operator: "lt", value: 30 }).build();
      const r = await searchManager.search("users", q);
      assert.equal(r.total, 2);
    });

    it("lte filter", async () => {
      const q = SearchQueryBuilder.create().withQuery("").addFilter({ field: "age", operator: "lte", value: 28 }).build();
      const r = await searchManager.search("users", q);
      assert.equal(r.total, 2);
    });

    it("gt filter", async () => {
      const q = SearchQueryBuilder.create().withQuery("").addFilter({ field: "age", operator: "gt", value: 30 }).build();
      const r = await searchManager.search("users", q);
      assert.equal(r.total, 2);
    });

    it("not_in filter", async () => {
      const q = SearchQueryBuilder.create().withQuery("").addFilter({ field: "role", operator: "not_in", value: ["admin"] }).build();
      const r = await searchManager.search("users", q);
      assert.equal(r.total, 3);
    });

    it("between filter", async () => {
      const q = SearchQueryBuilder.create().withQuery("").addFilter({ field: "age", operator: "between", value: [25, 30] }).build();
      const r = await searchManager.search("users", q);
      assert.equal(r.total, 3);
    });

    it("prefix filter", async () => {
      const q = SearchQueryBuilder.create().withQuery("").addFilter({ field: "name", operator: "prefix", value: "di" }).build();
      const r = await searchManager.search("users", q);
      assert.equal(r.total, 1);
    });
  });
});
