import type { AIRequest } from "../models/AIRequest.js";
import type { AIResponse, FinishReason } from "../models/AIResponse.js";
import type { AIProvider } from "../models/AIProvider.js";

export interface AICapabilities {
  streaming: boolean;
  functionCalling: boolean;
  vision: boolean;
  embeddings: boolean;
  maxContextTokens: number;
  maxOutputTokens: number;
}

export interface ProviderExecutionResult {
  content: string;
  finishReason: FinishReason;
  tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number };
  processingTimeMs: number;
}

export interface AIProviderAdapter {
  readonly providerType: string;
  execute(request: AIRequest, provider: AIProvider): Promise<ProviderExecutionResult>;
  validate(provider: AIProvider): Promise<boolean>;
  getCapabilities(): AICapabilities;
}

export class OpenAIAdapter implements AIProviderAdapter {
  readonly providerType = "openai";

  async execute(request: AIRequest, provider: AIProvider): Promise<ProviderExecutionResult> {
    const start = Date.now();
    return {
      content: `[OpenAI simulated response for: ${request.prompt.slice(0, 50)}...]`,
      finishReason: "stop",
      tokenUsage: { promptTokens: request.prompt.length / 4, completionTokens: 50, totalTokens: request.prompt.length / 4 + 50 },
      processingTimeMs: Date.now() - start,
    };
  }

  async validate(provider: AIProvider): Promise<boolean> { return true; }

  getCapabilities(): AICapabilities {
    return { streaming: true, functionCalling: true, vision: true, embeddings: true, maxContextTokens: 128000, maxOutputTokens: 4096 };
  }
}

export class AnthropicAdapter implements AIProviderAdapter {
  readonly providerType = "anthropic";

  async execute(request: AIRequest, provider: AIProvider): Promise<ProviderExecutionResult> {
    const start = Date.now();
    return {
      content: `[Anthropic simulated response for: ${request.prompt.slice(0, 50)}...]`,
      finishReason: "stop",
      tokenUsage: { promptTokens: request.prompt.length / 4, completionTokens: 60, totalTokens: request.prompt.length / 4 + 60 },
      processingTimeMs: Date.now() - start,
    };
  }

  async validate(provider: AIProvider): Promise<boolean> { return true; }

  getCapabilities(): AICapabilities {
    return { streaming: true, functionCalling: true, vision: true, embeddings: false, maxContextTokens: 100000, maxOutputTokens: 4096 };
  }
}

export class GeminiAdapter implements AIProviderAdapter {
  readonly providerType = "gemini";

  async execute(request: AIRequest, provider: AIProvider): Promise<ProviderExecutionResult> {
    const start = Date.now();
    return {
      content: `[Gemini simulated response for: ${request.prompt.slice(0, 50)}...]`,
      finishReason: "stop",
      tokenUsage: { promptTokens: request.prompt.length / 4, completionTokens: 55, totalTokens: request.prompt.length / 4 + 55 },
      processingTimeMs: Date.now() - start,
    };
  }

  async validate(provider: AIProvider): Promise<boolean> { return true; }

  getCapabilities(): AICapabilities {
    return { streaming: true, functionCalling: true, vision: true, embeddings: true, maxContextTokens: 32000, maxOutputTokens: 8192 };
  }
}

export class AzureOpenAIAdapter implements AIProviderAdapter {
  readonly providerType = "azure_openai";

  async execute(request: AIRequest, provider: AIProvider): Promise<ProviderExecutionResult> {
    const start = Date.now();
    return {
      content: `[Azure OpenAI simulated response for: ${request.prompt.slice(0, 50)}...]`,
      finishReason: "stop",
      tokenUsage: { promptTokens: request.prompt.length / 4, completionTokens: 50, totalTokens: request.prompt.length / 4 + 50 },
      processingTimeMs: Date.now() - start,
    };
  }

  async validate(provider: AIProvider): Promise<boolean> { return true; }

  getCapabilities(): AICapabilities {
    return { streaming: true, functionCalling: true, vision: true, embeddings: true, maxContextTokens: 128000, maxOutputTokens: 4096 };
  }
}

export class OllamaAdapter implements AIProviderAdapter {
  readonly providerType = "ollama";

  async execute(request: AIRequest, provider: AIProvider): Promise<ProviderExecutionResult> {
    const start = Date.now();
    return {
      content: `[Ollama simulated response for: ${request.prompt.slice(0, 50)}...]`,
      finishReason: "stop",
      tokenUsage: { promptTokens: request.prompt.length / 4, completionTokens: 40, totalTokens: request.prompt.length / 4 + 40 },
      processingTimeMs: Date.now() - start,
    };
  }

  async validate(provider: AIProvider): Promise<boolean> { return true; }

  getCapabilities(): AICapabilities {
    return { streaming: false, functionCalling: false, vision: false, embeddings: true, maxContextTokens: 8192, maxOutputTokens: 2048 };
  }
}

export class LMStudioAdapter implements AIProviderAdapter {
  readonly providerType = "lm_studio";

  async execute(request: AIRequest, provider: AIProvider): Promise<ProviderExecutionResult> {
    const start = Date.now();
    return {
      content: `[LM Studio simulated response for: ${request.prompt.slice(0, 50)}...]`,
      finishReason: "stop",
      tokenUsage: { promptTokens: request.prompt.length / 4, completionTokens: 45, totalTokens: request.prompt.length / 4 + 45 },
      processingTimeMs: Date.now() - start,
    };
  }

  async validate(provider: AIProvider): Promise<boolean> { return true; }

  getCapabilities(): AICapabilities {
    return { streaming: false, functionCalling: false, vision: false, embeddings: false, maxContextTokens: 4096, maxOutputTokens: 2048 };
  }
}
