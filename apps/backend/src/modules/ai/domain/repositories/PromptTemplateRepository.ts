import type { PromptTemplate, PromptTemplateCategory } from "../models/PromptTemplate.js";

export interface PromptTemplateRepository {
  save(template: PromptTemplate): Promise<void>;
  findById(id: string): Promise<PromptTemplate | null>;
  findByName(restaurantId: string, name: string): Promise<PromptTemplate | null>;
  findByRestaurant(restaurantId: string): Promise<PromptTemplate[]>;
  findByCategory(restaurantId: string, category: PromptTemplateCategory): Promise<PromptTemplate[]>;
  findActiveByCategory(restaurantId: string, category: PromptTemplateCategory): Promise<PromptTemplate[]>;
  delete(id: string): Promise<void>;
}
