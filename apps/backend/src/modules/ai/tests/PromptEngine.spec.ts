import { describe, it, expect } from "vitest";
import { PromptEngine } from "../domain/services/PromptEngine.js";
import { PromptTemplate } from "../domain/models/PromptTemplate.js";

describe("PromptEngine", () => {
  const engine = new PromptEngine();

  it("creates a prompt template", () => {
    const template = engine.createTemplate({
      restaurantId: "rest-1",
      name: "Demand Forecast",
      description: "Generates demand forecast prompt",
      category: "forecast",
      template: "Forecast demand for {{date}} with history {{history}}",
      variables: [
        { name: "date", type: "date", required: true },
        { name: "history", type: "json", required: true },
      ],
      tags: ["forecast", "demand"],
      createdBy: "system",
    });
    expect(template).toBeInstanceOf(PromptTemplate);
    expect(template.name).toBe("Demand Forecast");
    expect(template.category).toBe("forecast");
    expect(template.version).toBe(1);
    expect(template.isActive).toBe(true);
  });

  it("renders a template with variables", () => {
    const template = PromptTemplate.create({
      id: "tmpl-1", restaurantId: "rest-1",
      name: "Test", category: "custom",
      template: "Hello {{name}}, your table is {{tableNumber}}",
      variables: [
        { name: "name", type: "string", required: true },
        { name: "tableNumber", type: "number", required: true },
      ],
      tags: [], createdBy: "system",
    });

    const ctx = engine.renderTemplate({
      restaurantId: "rest-1",
      requestId: "req-1",
      template,
      variables: { name: "John", tableNumber: 5 },
    });

    expect(ctx.isValid()).toBe(true);
    expect(ctx.renderedPrompt).toBe("Hello John, your table is 5");
    expect(ctx.promptTemplateId).toBe("tmpl-1");
  });

  it("returns validation errors for missing required variables", () => {
    const template = PromptTemplate.create({
      id: "tmpl-2", restaurantId: "rest-1",
      name: "Strict", category: "custom",
      template: "{{required1}} and {{required2}}",
      variables: [
        { name: "required1", type: "string", required: true },
        { name: "required2", type: "string", required: true },
      ],
      tags: [], createdBy: "system",
    });

    const ctx = engine.renderTemplate({
      restaurantId: "rest-1",
      requestId: "req-2",
      template,
      variables: { required1: "only_one" },
    });

    expect(ctx.isValid()).toBe(false);
    expect(ctx.validationErrors.length).toBeGreaterThan(0);
    expect(ctx.validationErrors[0]).toContain("required2");
  });

  it("renders raw prompts without validation", () => {
    const ctx = engine.renderRaw({
      restaurantId: "rest-1",
      requestId: "req-3",
      prompt: "Hello {{name}}",
      variables: { name: "World" },
    });

    expect(ctx.isValid()).toBe(true);
    expect(ctx.renderedPrompt).toBe("Hello World");
  });

  it("creates a new version of a template", () => {
    const template = PromptTemplate.create({
      id: "tmpl-3", restaurantId: "rest-1",
      name: "Versioned", category: "custom",
      template: "Version 1",
      variables: [], tags: [], createdBy: "system",
    });

    const v2 = engine.createVersion(template, "Version 2");
    expect(v2.version).toBe(2);
    expect(v2.template).toBe("Version 2");
  });

  it("handles missing variables gracefully in rendering", () => {
    const template = PromptTemplate.create({
      id: "tmpl-4", restaurantId: "rest-1",
      name: "Missing", category: "custom",
      template: "Hello {{name}}",
      variables: [
        { name: "name", type: "string", required: true },
      ],
      tags: [], createdBy: "system",
    });

    const ctx = engine.renderTemplate({
      restaurantId: "rest-1",
      requestId: "req-4",
      template,
      variables: {},
    });

    expect(ctx.renderedPrompt).toBe("Hello {{name}}");
    expect(ctx.isValid()).toBe(false);
  });

  it("stringifies object variables", () => {
    const template = PromptTemplate.create({
      id: "tmpl-5", restaurantId: "rest-1",
      name: "Object", category: "custom",
      template: "Data: {{obj}}",
      variables: [
        { name: "obj", type: "json", required: true },
      ],
      tags: [], createdBy: "system",
    });

    const ctx = engine.renderTemplate({
      restaurantId: "rest-1",
      requestId: "req-5",
      template,
      variables: { obj: { foo: "bar", num: 42 } },
    });

    expect(ctx.renderedPrompt).toBe('Data: {"foo":"bar","num":42}');
  });
});
