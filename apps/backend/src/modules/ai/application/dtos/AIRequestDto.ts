import type { AIRequest, AIRequestStatus, AIExecutionMode, TokenUsage } from "../../domain/models/AIRequest.js";

export interface AIRequestDto {
  id: string;
  restaurantId: string;
  promptTemplateId: string | null;
  provider: string;
  model: string;
  prompt: string;
  executionMode: AIExecutionMode;
  maxTokens: number;
  temperature: number;
  status: AIRequestStatus;
  result: string | null;
  error: string | null;
  processingTimeMs: number | null;
  tokenUsage: TokenUsage | null;
  requestedAt: string;
  completedAt: string | null;
}

export function toAIRequestDto(request: AIRequest): AIRequestDto {
  return {
    id: request.id,
    restaurantId: request.restaurantId,
    promptTemplateId: request.promptTemplateId ?? null,
    provider: request.provider,
    model: request.model,
    prompt: request.prompt,
    executionMode: request.executionMode,
    maxTokens: request.maxTokens,
    temperature: request.temperature,
    status: request.status,
    result: request.result ?? null,
    error: request.error ?? null,
    processingTimeMs: request.processingTimeMs ?? null,
    tokenUsage: request.tokenUsage ?? null,
    requestedAt: request.requestedAt.toISOString(),
    completedAt: request.completedAt?.toISOString() ?? null,
  };
}
