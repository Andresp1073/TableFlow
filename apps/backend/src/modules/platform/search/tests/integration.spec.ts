import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { SearchManager } from "../SearchManager.js";
import { SearchIndex } from "../SearchIndex.js";
import { SearchIndexer } from "../SearchIndexer.js";
import { SearchQueryBuilder } from "../SearchQueryBuilder.js";
import { buildSearchDocument, generateDocumentId } from "../SearchDocument.js";
import type { SearchProviderConfig } from "../types.js";

const config: SearchProviderConfig = {
  type: "database",
  indexPrefix: "tf_",
  defaultLimit: 20,
  maxLimit: 100,
};

describe("Search Integration", () => {
  let indexManager: SearchIndex;
  let indexer: SearchIndexer;
  let search: SearchManager;

  beforeEach(() => {
    indexManager = new SearchIndex(config);
    indexer = new SearchIndexer(indexManager);
    search = new SearchManager(indexManager, indexer, config);
  });

  it("full lifecycle: create index, index docs, search, delete", async () => {
    await search.createIndex({
      name: "products",
      settings: { numberOfShards: 1 },
      mapping: [
        { name: "name", type: "text", searchable: true },
        { name: "category", type: "keyword", filterable: true },
        { name: "price", type: "float", filterable: true, sortable: true },
      ],
      version: 1,
    });

    const products = [
      buildSearchDocument("product", { name: "Laptop", category: "electronics", price: 1200 }),
      buildSearchDocument("product", { name: "Phone", category: "electronics", price: 800 }),
      buildSearchDocument("product", { name: "Shirt", category: "clothing", price: 40 }),
      buildSearchDocument("product", { name: "Shoes", category: "clothing", price: 100 }),
      buildSearchDocument("product", { name: "Tablet", category: "electronics", price: 500 }),
    ];

    for (const p of products) {
      await search.indexDocument("products", p);
    }

    const allResult = await search.search("products", SearchQueryBuilder.create().withQuery("").build());
    assert.equal(allResult.total, 5);

    const electronicsResult = await search.search(
      "products",
      SearchQueryBuilder.create().withQuery("").addFilter({ field: "category", operator: "eq", value: "electronics" }).build(),
    );
    assert.equal(electronicsResult.total, 3);

    const sortedResult = await search.search(
      "products",
      SearchQueryBuilder.create().withQuery("").withSort("price", "desc").build(),
    );
    assert.equal(sortedResult.documents[0].payload["price"], 1200);
    assert.equal(sortedResult.documents[4].payload["price"], 40);

    const searchLaptop = await search.search(
      "products",
      SearchQueryBuilder.create().withQuery("laptop").build(),
    );
    assert.equal(searchLaptop.total, 1);

    const paginatedResult = await search.search(
      "products",
      SearchQueryBuilder.create().withQuery("").withPagination(0, 2).build(),
    );
    assert.equal(paginatedResult.documents.length, 2);

    await search.deleteIndex("products");
    assert.equal(await search.indexExists("products"), false);
  });

  it("supports faceted search on categories", async () => {
    await search.createIndex({
      name: "inventory",
      settings: {},
      mapping: [
        { name: "name", type: "text", searchable: true },
        { name: "category", type: "keyword", filterable: true },
        { name: "warehouse", type: "keyword", filterable: true },
      ],
      version: 1,
    });

    const items = [
      buildSearchDocument("item", { name: "Item A", category: "food", warehouse: "W1" }),
      buildSearchDocument("item", { name: "Item B", category: "food", warehouse: "W2" }),
      buildSearchDocument("item", { name: "Item C", category: "beverage", warehouse: "W1" }),
      buildSearchDocument("item", { name: "Item D", category: "food", warehouse: "W1" }),
    ];
    for (const item of items) {
      await search.indexDocument("inventory", item);
    }

    const facetRequest = SearchQueryBuilder.create()
      .withQuery("")
      .buildFacetedRequest(["category", "warehouse"], { size: 10, order: "count" });

    const result = await search.facetedSearch("inventory", facetRequest);

    assert.ok(result.facets);
    assert.equal(result.facets["category"].length, 2);
    assert.equal(result.facets["warehouse"].length, 2);

    const foodFacet = result.facets["category"].find((f) => f.value === "food");
    assert.equal(foodFacet?.count, 3);
  });

  it("supports autocomplete", async () => {
    await search.createIndex({
      name: "autocomplete-idx",
      settings: {},
      mapping: [{ name: "title", type: "text", searchable: true }],
      version: 1,
    });

    const docs = [
      buildSearchDocument("page", { title: "Apple Pie Recipe" }),
      buildSearchDocument("page", { title: "Apple Cider" }),
      buildSearchDocument("page", { title: "Application Guide" }),
      buildSearchDocument("page", { title: "Banana Bread" }),
    ];
    for (const doc of docs) {
      await search.indexDocument("autocomplete-idx", doc);
    }

    const suggestions = await search.autocomplete("autocomplete-idx", "app");
    assert.equal(suggestions.length, 3);
    assert.ok(suggestions.includes("Apple Pie Recipe"));
    assert.ok(suggestions.includes("Apple Cider"));
    assert.ok(suggestions.includes("Application Guide"));
  });

  it("handles document update lifecycle", async () => {
    await search.createIndex({
      name: "updates",
      settings: {},
      mapping: [{ name: "content", type: "text", searchable: true }],
      version: 1,
    });

    const docId = generateDocumentId();
    await search.indexDocument("updates", buildSearchDocument("note", { content: "Version 1" }, { id: docId }));
    await search.updateDocument("updates", { id: docId, payload: { content: "Version 2" } });

    const result = await search.search("updates", SearchQueryBuilder.create().withQuery("Version 2").build());
    assert.equal(result.total, 1);
    const updatedDoc = result.documents[0];
    assert.equal(updatedDoc.payload["content"], "Version 2");
    assert.equal(updatedDoc.version, 2);

    await search.deleteDocument("updates", docId);
    const afterDelete = await search.search("updates", SearchQueryBuilder.create().withQuery("Version 2").build());
    assert.equal(afterDelete.total, 0);
  });

  it("handles multiple indexes independently", async () => {
    await search.createIndex({
      name: "idx-a",
      settings: {},
      mapping: [{ name: "value", type: "text", searchable: true }],
      version: 1,
    });
    await search.createIndex({
      name: "idx-b",
      settings: {},
      mapping: [{ name: "value", type: "text", searchable: true }],
      version: 1,
    });

    await search.indexDocument("idx-a", buildSearchDocument("type", { value: "from A" }));
    await search.indexDocument("idx-b", buildSearchDocument("type", { value: "from B" }));
    await search.indexDocument("idx-b", buildSearchDocument("type", { value: "from B2" }));

    const resultA = await search.search("idx-a", SearchQueryBuilder.create().withQuery("").build());
    assert.equal(resultA.total, 1);

    const resultB = await search.search("idx-b", SearchQueryBuilder.create().withQuery("").build());
    assert.equal(resultB.total, 2);
  });

  it("supports boosting search results", async () => {
    await search.createIndex({
      name: "boosting",
      settings: {},
      mapping: [
        { name: "title", type: "text", searchable: true },
        { name: "description", type: "text", searchable: true },
      ],
      version: 1,
    });

    await search.indexDocument("boosting", buildSearchDocument("doc", { title: "apple fruit", description: "sweet fruit" }));
    await search.indexDocument("boosting", buildSearchDocument("doc", { title: "fruit salad", description: "apple slices" }));
    await search.indexDocument("boosting", buildSearchDocument("doc", { title: "orange juice", description: "citrus fruit" }));

    const query = SearchQueryBuilder.create()
      .withQuery("fruit")
      .addBoost("title", 2.0)
      .build();

    const result = await search.search("boosting", query);
    assert.equal(result.total, 3);
    assert.ok(result.documents[0].score! >= result.documents[1].score!);
  });

  it("returns zero results for non-existent index operations", async () => {
    const result = await search.search("nope", SearchQueryBuilder.create().withQuery("anything").build());
    assert.equal(result.total, 0);

    const suggestions = await search.autocomplete("nope", "test");
    assert.equal(suggestions.length, 0);

    const facetRequest = SearchQueryBuilder.create().withQuery("").buildFacetedRequest(["field"]);
    const facetResult = await search.facetedSearch("nope", facetRequest);
    assert.equal(facetResult.total, 0);
  });
});
