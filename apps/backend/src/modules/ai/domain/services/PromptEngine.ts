import { PromptTemplate, type PromptTemplateCategory, type PromptVariable } from "../models/PromptTemplate.js";
import { PromptContext } from "../models/PromptContext.js";

export interface CreateTemplateParams {
  restaurantId: string;
  name: string;
  description?: string;
  category: PromptTemplateCategory;
  template: string;
  variables: PromptVariable[];
  tags: string[];
  createdBy: string;
}

export interface RenderPromptParams {
  restaurantId: string;
  requestId: string;
  template: PromptTemplate;
  variables: Record<string, unknown>;
}

export interface RenderRawPromptParams {
  restaurantId: string;
  requestId: string;
  prompt: string;
  variables: Record<string, unknown>;
}

export class PromptEngine {
  createTemplate(params: CreateTemplateParams): PromptTemplate {
    return PromptTemplate.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      name: params.name,
      description: params.description,
      category: params.category,
      template: params.template,
      variables: params.variables,
      tags: params.tags,
      createdBy: params.createdBy,
    });
  }

  renderTemplate(params: RenderPromptParams): PromptContext {
    const errors = params.template.validateVariables(params.variables);
    const rendered = this.renderString(params.template.template, params.variables);

    return PromptContext.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      requestId: params.requestId,
      promptTemplateId: params.template.id,
      renderedPrompt: rendered,
      variables: params.variables,
      validationErrors: errors,
    });
  }

  renderRaw(params: RenderRawPromptParams): PromptContext {
    const rendered = this.renderString(params.prompt, params.variables);

    return PromptContext.create({
      id: crypto.randomUUID(),
      restaurantId: params.restaurantId,
      requestId: params.requestId,
      renderedPrompt: rendered,
      variables: params.variables,
      validationErrors: [],
    });
  }

  createVersion(template: PromptTemplate, newTemplate: string, newVariables?: PromptVariable[]): PromptTemplate {
    return template.createVersion(newTemplate, newVariables);
  }

  private renderString(template: string, variables: Record<string, unknown>): string {
    return template.replace(/{{(\w+)}}/g, (_, key: string) => {
      const value = variables[key];
      if (value === undefined || value === null) return `{{${key}}}`;
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    });
  }
}
