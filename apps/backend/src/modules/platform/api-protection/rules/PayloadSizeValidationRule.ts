import { BaseRule } from "./ProtectionRule.js";
import type { ProtectionContext, ProtectionDecision } from "../types.js";

const MAX_CONTENT_LENGTH = 10 * 1024 * 1024;
const MIN_CONTENT_LENGTH = 0;

export class PayloadSizeValidationRule extends BaseRule {
  private readonly maxBytes: number;
  private readonly minBytes: number;

  constructor(
    priority = 30,
    maxBytes = MAX_CONTENT_LENGTH,
    minBytes = MIN_CONTENT_LENGTH,
    enabled = true,
  ) {
    super("payload_size_validation", priority, enabled);
    this.maxBytes = maxBytes;
    this.minBytes = minBytes;
  }

  async evaluate(context: ProtectionContext): Promise<ProtectionDecision> {
    const contentLength = context.contentLength;

    if (contentLength === undefined || contentLength === null) {
      return this.skip("No content length to validate");
    }

    if (contentLength < this.minBytes) {
      return this.rejected(
        `Payload too small: ${contentLength} bytes (minimum ${this.minBytes})`,
        "oversized_payload",
        "low",
        { contentLength, minBytes: this.minBytes },
      );
    }

    if (contentLength > this.maxBytes) {
      return this.rejected(
        `Payload exceeds maximum size: ${contentLength} bytes (limit ${this.maxBytes})`,
        "oversized_payload",
        "high",
        { contentLength, maxBytes: this.maxBytes },
      );
    }

    return this.allowed({ contentLength });
  }
}
