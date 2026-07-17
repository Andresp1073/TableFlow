import { describe, it, expect } from "vitest";
import { OpenAIAdapter, AnthropicAdapter, GeminiAdapter, AzureOpenAIAdapter, OllamaAdapter, LMStudioAdapter } from "../domain/services/AIProviderAdapter.js";
import { AIRequest } from "../domain/models/AIRequest.js";
import { AIProvider } from "../domain/models/AIProvider.js";

function makeRequest(): AIRequest {
  return AIRequest.reconstitute({
    id: "req-1", restaurantId: "rest-1", provider: "openai",
    model: "gpt-4", prompt: "Test prompt for provider adapter",
    variables: {}, executionMode: "sync", maxTokens: 100,
    temperature: 0.7, status: "pending", requestedAt: new Date(),
  });
}

function makeProvider(type: string): AIProvider {
  return AIProvider.reconstitute({
    id: "prov-1", restaurantId: "rest-1", name: "Test Provider",
    type: type as never, models: ["gpt-4", "claude-3"],
    defaultModel: "gpt-4", status: "active", isActive: true,
    capabilities: {
      streaming: true, functionCalling: true, vision: true,
      embeddings: true, maxContextTokens: 128000, maxOutputTokens: 4096,
    },
    rateLimit: { requestsPerMinute: 60, tokensPerMinute: 100000, concurrentRequests: 10 },
    retryPolicy: { maxRetries: 3, initialDelayMs: 1000, backoffMultiplier: 2, maxDelayMs: 30000 },
    priority: 1, createdAt: new Date(), updatedAt: new Date(),
  });
}

describe("AIProviderAdapter", () => {
  describe("OpenAIAdapter", () => {
    const adapter = new OpenAIAdapter();
    const request = makeRequest();
    const provider = makeProvider("openai");

    it("returns correct provider type", () => {
      expect(adapter.providerType).toBe("openai");
    });

    it("executes and returns simulated response", async () => {
      const result = await adapter.execute(request, provider);
      expect(result.content).toContain("OpenAI simulated response");
      expect(result.finishReason).toBe("stop");
      expect(result.tokenUsage.promptTokens).toBeGreaterThan(0);
      expect(result.tokenUsage.completionTokens).toBeGreaterThan(0);
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it("validates successfully", async () => {
      await expect(adapter.validate(provider)).resolves.toBe(true);
    });

    it("returns capabilities", () => {
      const caps = adapter.getCapabilities();
      expect(caps.streaming).toBe(true);
      expect(caps.maxContextTokens).toBe(128000);
    });
  });

  describe("AnthropicAdapter", () => {
    const adapter = new AnthropicAdapter();
    const request = makeRequest();
    const provider = makeProvider("anthropic");

    it("returns correct provider type", () => {
      expect(adapter.providerType).toBe("anthropic");
    });

    it("executes and returns simulated response", async () => {
      const result = await adapter.execute(request, provider);
      expect(result.content).toContain("Anthropic simulated response");
      expect(result.finishReason).toBe("stop");
    });

    it("returns capabilities", () => {
      const caps = adapter.getCapabilities();
      expect(caps.embeddings).toBe(false);
      expect(caps.maxContextTokens).toBe(100000);
    });
  });

  describe("GeminiAdapter", () => {
    const adapter = new GeminiAdapter();
    const request = makeRequest();
    const provider = makeProvider("gemini");

    it("returns correct provider type", () => {
      expect(adapter.providerType).toBe("gemini");
    });

    it("executes and returns simulated response", async () => {
      const result = await adapter.execute(request, provider);
      expect(result.content).toContain("Gemini simulated response");
    });

    it("returns capabilities", () => {
      const caps = adapter.getCapabilities();
      expect(caps.maxOutputTokens).toBe(8192);
    });
  });

  describe("AzureOpenAIAdapter", () => {
    const adapter = new AzureOpenAIAdapter();
    const request = makeRequest();
    const provider = makeProvider("azure_openai");

    it("returns correct provider type", () => {
      expect(adapter.providerType).toBe("azure_openai");
    });

    it("executes and returns simulated response", async () => {
      const result = await adapter.execute(request, provider);
      expect(result.content).toContain("Azure OpenAI simulated response");
    });
  });

  describe("OllamaAdapter", () => {
    const adapter = new OllamaAdapter();
    const request = makeRequest();
    const provider = makeProvider("ollama");

    it("returns correct provider type", () => {
      expect(adapter.providerType).toBe("ollama");
    });

    it("executes and returns simulated response", async () => {
      const result = await adapter.execute(request, provider);
      expect(result.content).toContain("Ollama simulated response");
    });

    it("returns limited capabilities", () => {
      const caps = adapter.getCapabilities();
      expect(caps.streaming).toBe(false);
      expect(caps.vision).toBe(false);
      expect(caps.maxContextTokens).toBe(8192);
    });
  });

  describe("LMStudioAdapter", () => {
    const adapter = new LMStudioAdapter();
    const request = makeRequest();
    const provider = makeProvider("lm_studio");

    it("returns correct provider type", () => {
      expect(adapter.providerType).toBe("lm_studio");
    });

    it("executes and returns simulated response", async () => {
      const result = await adapter.execute(request, provider);
      expect(result.content).toContain("LM Studio simulated response");
    });

    it("returns minimal capabilities", () => {
      const caps = adapter.getCapabilities();
      expect(caps.streaming).toBe(false);
      expect(caps.functionCalling).toBe(false);
      expect(caps.vision).toBe(false);
      expect(caps.embeddings).toBe(false);
      expect(caps.maxContextTokens).toBe(4096);
    });
  });
});
