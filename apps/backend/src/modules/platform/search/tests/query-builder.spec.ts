import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SearchQueryBuilder } from "../SearchQueryBuilder.js";

describe("SearchQueryBuilder", () => {
  it("builds a basic query", () => {
    const query = SearchQueryBuilder.create()
      .withQuery("test")
      .build();

    assert.equal(query.query, "test");
    assert.equal(query.fields, undefined);
    assert.equal(query.filters, undefined);
  });

  it("builds with fields", () => {
    const query = SearchQueryBuilder.create()
      .withQuery("search")
      .withFields(["name", "description"])
      .build();

    assert.deepEqual(query.fields, ["name", "description"]);
  });

  it("builds with filters", () => {
    const query = SearchQueryBuilder.create()
      .withQuery("test")
      .addFilter({ field: "status", operator: "eq", value: "active" })
      .addFilter({ field: "price", operator: "gte", value: 10 })
      .build();

    assert.equal(query.filters!.length, 2);
    assert.equal(query.filters![0].field, "status");
    assert.equal(query.filters![1].field, "price");
  });

  it("builds with multiple filters at once", () => {
    const query = SearchQueryBuilder.create()
      .withQuery("test")
      .addFilters([
        { field: "a", operator: "eq", value: 1 },
        { field: "b", operator: "eq", value: 2 },
      ])
      .build();

    assert.equal(query.filters!.length, 2);
  });

  it("builds with sort", () => {
    const query = SearchQueryBuilder.create()
      .withQuery("test")
      .withSort("createdAt", "desc")
      .build();

    assert.equal(query.sort!.field, "createdAt");
    assert.equal(query.sort!.order, "desc");
  });

  it("defaults sort to asc", () => {
    const query = SearchQueryBuilder.create()
      .withQuery("test")
      .withSort("name")
      .build();

    assert.equal(query.sort!.order, "asc");
  });

  it("builds with pagination", () => {
    const query = SearchQueryBuilder.create()
      .withQuery("test")
      .withPagination(10, 20)
      .build();

    assert.equal(query.pagination!.offset, 10);
    assert.equal(query.pagination!.limit, 20);
  });

  it("builds with page number", () => {
    const query = SearchQueryBuilder.create()
      .withQuery("test")
      .withPage(3, 25)
      .build();

    assert.equal(query.pagination!.offset, 50);
    assert.equal(query.pagination!.limit, 25);
  });

  it("builds with boosts", () => {
    const query = SearchQueryBuilder.create()
      .withQuery("test")
      .addBoost("name", 2.0)
      .addBoost("description", 1.5)
      .build();

    assert.equal(query.boost!.length, 2);
    assert.equal(query.boost![0].field, "name");
    assert.equal(query.boost![0].value, 2.0);
  });

  it("builds with highlight", () => {
    const query = SearchQueryBuilder.create()
      .withQuery("test")
      .withHighlight(["name", "description"], "<em>", "</em>")
      .build();

    assert.equal(query.highlight!.fields.length, 2);
    assert.equal(query.highlight!.preTag, "<em>");
    assert.equal(query.highlight!.postTag, "</em>");
  });

  it("builds with type filter", () => {
    const query = SearchQueryBuilder.create()
      .withQuery("test")
      .withType("restaurant")
      .build();

    assert.equal(query.type, "restaurant");
  });

  it("builds with minimumShouldMatch", () => {
    const query = SearchQueryBuilder.create()
      .withQuery("test")
      .withMinimumShouldMatch("75%")
      .build();

    assert.equal(query.minimumShouldMatch, "75%");
  });

  it("builds with analyzers", () => {
    const query = SearchQueryBuilder.create()
      .withQuery("test")
      .withAnalyzers(["standard", "english"])
      .build();

    assert.deepEqual(query.analyzers, ["standard", "english"]);
  });

  it("validates that query is required", () => {
    const result = SearchQueryBuilder.create().validate();
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("Query string")));
  });

  it("validates pagination offset", () => {
    const result = SearchQueryBuilder.create()
      .withQuery("test")
      .withPagination(-1, 10)
      .validate();
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("Offset")));
  });

  it("validates pagination limit", () => {
    const result = SearchQueryBuilder.create()
      .withQuery("test")
      .withPagination(0, 0)
      .validate();
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("Limit")));
  });

  it("validates boost values", () => {
    const result = SearchQueryBuilder.create()
      .withQuery("test")
      .addBoost("name", 0)
      .validate();
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("Boost")));
  });

  it("buildOrThrow throws on invalid query", () => {
    assert.throws(
      () => SearchQueryBuilder.create().buildOrThrow(),
      /Invalid search query/,
    );
  });

  it("buildOrThrow returns query on valid input", () => {
    const query = SearchQueryBuilder.create()
      .withQuery("valid")
      .buildOrThrow();
    assert.equal(query.query, "valid");
  });

  it("clones a builder", () => {
    const original = SearchQueryBuilder.create()
      .withQuery("test")
      .withFields(["name"])
      .addFilter({ field: "status", operator: "eq", value: "active" });

    const clone = original.clone();
    clone.withQuery("changed");

    const origQuery = original.build();
    const cloneQuery = clone.build();

    assert.equal(origQuery.query, "test");
    assert.equal(cloneQuery.query, "changed");
    assert.deepEqual(origQuery.fields, ["name"]);
  });

  it("builds from existing query", () => {
    const original = SearchQueryBuilder.create()
      .withQuery("test")
      .withSort("name", "desc")
      .build();

    const rebuilt = SearchQueryBuilder.fromQuery(original).build();
    assert.equal(rebuilt.query, "test");
    assert.equal(rebuilt.sort!.field, "name");
    assert.equal(rebuilt.sort!.order, "desc");
  });

  it("builds autocomplete options", () => {
    const builder = SearchQueryBuilder.create().withQuery("test");
    const options = builder.buildAutocompleteOptions({ size: 5, type: "user" });
    assert.equal(options!.size, 5);
    assert.equal(options!.type, "user");
  });

  it("builds faceted request", () => {
    const request = SearchQueryBuilder.create()
      .withQuery("test")
      .buildFacetedRequest(["category", "status"], { size: 10, order: "count" });

    assert.equal(request.facets.length, 2);
    assert.equal(request.facets[0].field, "category");
    assert.equal(request.facets[1].field, "status");
    assert.equal(request.query.query, "test");
  });
});
