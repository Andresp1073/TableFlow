export type PromptTemplateCategory =
  | "forecast"
  | "recommendation"
  | "analysis"
  | "classification"
  | "generation"
  | "custom";

export interface PromptTemplateConfig {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  category: PromptTemplateCategory;
  template: string;
  variables: PromptVariable[];
  version: number;
  isActive: boolean;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface PromptVariable {
  name: string;
  type: "string" | "number" | "boolean" | "json" | "date";
  required: boolean;
  description?: string;
  defaultValue?: unknown;
  validation?: PromptVariableValidation;
}

export interface PromptVariableValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  enum?: string[];
}

export class PromptTemplate {
  private constructor(private readonly config: PromptTemplateConfig) {}

  static create(config: Omit<PromptTemplateConfig, "version" | "isActive" | "createdAt" | "updatedAt">): PromptTemplate {
    const now = new Date();
    return new PromptTemplate({ ...config, version: 1, isActive: true, createdAt: now, updatedAt: now });
  }

  static reconstitute(config: PromptTemplateConfig): PromptTemplate {
    return new PromptTemplate(config);
  }

  get id(): string { return this.config.id; }
  get restaurantId(): string { return this.config.restaurantId; }
  get name(): string { return this.config.name; }
  get description(): string | undefined { return this.config.description; }
  get category(): PromptTemplateCategory { return this.config.category; }
  get template(): string { return this.config.template; }
  get variables(): PromptVariable[] { return this.config.variables; }
  get version(): number { return this.config.version; }
  get isActive(): boolean { return this.config.isActive; }
  get tags(): string[] { return this.config.tags; }
  get createdBy(): string { return this.config.createdBy; }
  get createdAt(): Date { return this.config.createdAt; }
  get updatedAt(): Date { return this.config.updatedAt; }

  createVersion(newTemplate: string, newVariables?: PromptVariable[]): PromptTemplate {
    return PromptTemplate.reconstitute({
      ...this.config,
      template: newTemplate,
      variables: newVariables ?? this.config.variables,
      version: this.config.version + 1,
      updatedAt: new Date(),
    });
  }

  activate(): PromptTemplate {
    return PromptTemplate.reconstitute({ ...this.config, isActive: true, updatedAt: new Date() });
  }

  deactivate(): PromptTemplate {
    return PromptTemplate.reconstitute({ ...this.config, isActive: false, updatedAt: new Date() });
  }

  getRequiredVariables(): string[] {
    return this.config.variables.filter((v) => v.required).map((v) => v.name);
  }

  validateVariables(values: Record<string, unknown>): string[] {
    const errors: string[] = [];
    for (const variable of this.config.variables) {
      const value = values[variable.name];
      if (variable.required && (value === undefined || value === null)) {
        errors.push(`Missing required variable: ${variable.name}`);
        continue;
      }
      if (value === undefined || value === null) continue;
      if (variable.validation) {
        const val = String(value);
        if (variable.validation.minLength && val.length < variable.validation.minLength) {
          errors.push(`${variable.name} must be at least ${variable.validation.minLength} characters`);
        }
        if (variable.validation.maxLength && val.length > variable.validation.maxLength) {
          errors.push(`${variable.name} must be at most ${variable.validation.maxLength} characters`);
        }
        if (variable.validation.enum && !variable.validation.enum.includes(val)) {
          errors.push(`${variable.name} must be one of: ${variable.validation.enum.join(", ")}`);
        }
      }
    }
    return errors;
  }
}
