import type { AIResponse, FinishReason } from "../../domain/models/AIResponse.js";
import type { TokenUsage } from "../../domain/models/AIRequest.js";

export interface AIResponseDto {
  id: string;
  requestId: string;
  content: string;
  model: string;
  provider: string;
  finishReason: FinishReason;
  tokenUsage: TokenUsage;
  processingTimeMs: number;
  createdAt: string;
}

export function toAIResponseDto(response: AIResponse): AIResponseDto {
  return {
    id: response.id,
    requestId: response.requestId,
    content: response.content,
    model: response.model,
    provider: response.provider,
    finishReason: response.finishReason,
    tokenUsage: response.tokenUsage,
    processingTimeMs: response.processingTimeMs,
    createdAt: response.createdAt.toISOString(),
  };
}
