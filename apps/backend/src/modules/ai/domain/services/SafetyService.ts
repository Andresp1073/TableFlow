import { SafetyConfig } from "../models/SafetyConfig.js";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class SafetyService {
  private config?: SafetyConfig;

  setConfig(config: SafetyConfig): void {
    this.config = config;
  }

  getConfig(): SafetyConfig | undefined {
    return this.config;
  }

  validatePrompt(prompt: string): ValidationResult {
    if (!this.config) return { isValid: true, errors: [] };
    const errors = this.config.validatePrompt(prompt);
    return { isValid: errors.length === 0, errors };
  }

  validateOutput(output: string): ValidationResult {
    if (!this.config) return { isValid: true, errors: [] };
    const errors = this.config.validateOutput(output);
    return { isValid: errors.length === 0, errors };
  }

  maskPII(text: string): string {
    if (!this.config) return text;
    return this.config.maskPII(text);
  }

  calculateCost(promptTokens: number, completionTokens: number): number {
    if (!this.config) return 0;
    return this.config.calculateCost(promptTokens, completionTokens);
  }
}
