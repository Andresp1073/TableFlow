import type { PromptTemplate, PromptTemplateCategory, PromptVariable } from "../../domain/models/PromptTemplate.js";

export interface PromptTemplateDto {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  category: PromptTemplateCategory;
  template: string;
  variables: PromptVariable[];
  version: number;
  isActive: boolean;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function toPromptTemplateDto(template: PromptTemplate): PromptTemplateDto {
  return {
    id: template.id,
    restaurantId: template.restaurantId,
    name: template.name,
    description: template.description ?? null,
    category: template.category,
    template: template.template,
    variables: template.variables.map((v) => ({ ...v })),
    version: template.version,
    isActive: template.isActive,
    tags: [...template.tags],
    createdBy: template.createdBy,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}
