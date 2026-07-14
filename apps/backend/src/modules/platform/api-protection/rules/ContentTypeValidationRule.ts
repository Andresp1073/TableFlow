import { BaseRule } from "./ProtectionRule.js";
import type { ProtectionContext, ProtectionDecision } from "../types.js";

const VALID_CONTENT_TYPES = [
  "application/json",
  "application/x-www-form-urlencoded",
  "multipart/form-data",
  "text/plain",
  "application/xml",
  "text/xml",
  "application/graphql-response+json",
  "application/vnd.api+json",
];

const FORBIDDEN_CONTENT_TYPES = [
  "application/x-msdownload",
  "application/x-ms-installer",
  "application/x-sh",
  "application/x-csh",
  "application/x-httpd-php",
  "application/x-javascript",
  "application/javascript",
  "text/javascript",
  "application/x-perl",
  "application/x-python",
  "application/x-ruby",
  "application/java-archive",
  "application/x-java-archive",
  "application/xhtml+xml",
];

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export class ContentTypeValidationRule extends BaseRule {
  private readonly validTypes: string[];
  private readonly forbiddenTypes: string[];

  constructor(
    priority = 20,
    validTypes = VALID_CONTENT_TYPES,
    forbiddenTypes = FORBIDDEN_CONTENT_TYPES,
    enabled = true,
  ) {
    super("content_type_validation", priority, enabled);
    this.validTypes = validTypes;
    this.forbiddenTypes = forbiddenTypes;
  }

  async evaluate(context: ProtectionContext): Promise<ProtectionDecision> {
    const contentType = context.contentType;

    if (!contentType || contentType === "") {
      if (MUTATION_METHODS.has(context.method.toUpperCase())) {
        return this.warning(
          "Missing Content-Type header in mutation request",
          "invalid_content_type",
          "low",
          { method: context.method },
        );
      }

      return this.skip("No content type to validate");
    }

    const normalized = contentType.toLowerCase().split(";")[0].trim();

    for (const forbidden of this.forbiddenTypes) {
      if (normalized.startsWith(forbidden)) {
        return this.rejected(
          `Forbidden Content-Type: ${contentType}`,
          "invalid_content_type",
          "high",
          { contentType },
        );
      }
    }

    for (const valid of this.validTypes) {
      if (normalized.startsWith(valid)) {
        return this.allowed({ contentType });
      }
    }

    return this.warning(
      `Unrecognized Content-Type: ${contentType}`,
      "invalid_content_type",
      "medium",
      { contentType },
    );
  }
}
