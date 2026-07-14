import { BaseRule } from "./ProtectionRule.js";
import type { ProtectionContext, ProtectionDecision } from "../types.js";

const VALID_HTTP_METHODS = new Set([
  "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS",
]);

const DANGEROUS_METHODS = new Set(["TRACE", "CONNECT"]);

export class HttpMethodValidationRule extends BaseRule {
  private readonly validMethods: Set<string>;
  private readonly dangerousMethods: Set<string>;

  constructor(
    priority = 40,
    validMethods = VALID_HTTP_METHODS,
    dangerousMethods = DANGEROUS_METHODS,
    enabled = true,
  ) {
    super("http_method_validation", priority, enabled);
    this.validMethods = validMethods;
    this.dangerousMethods = dangerousMethods;
  }

  async evaluate(context: ProtectionContext): Promise<ProtectionDecision> {
    const method = context.method?.toUpperCase() ?? "GET";

    if (this.dangerousMethods.has(method)) {
      return this.rejected(
        `Dangerous HTTP method blocked: ${method}`,
        "unexpected_method",
        "high",
        { method },
      );
    }

    if (!this.validMethods.has(method)) {
      return this.rejected(
        `Invalid HTTP method: ${method}`,
        "unexpected_method",
        "medium",
        { method },
      );
    }

    return this.allowed({ method });
  }
}
