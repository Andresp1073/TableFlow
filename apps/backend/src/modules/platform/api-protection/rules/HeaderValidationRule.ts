import { BaseRule } from "./ProtectionRule.js";
import type { ProtectionContext, ProtectionDecision } from "../types.js";

const SUSPICIOUS_HEADER_PATTERNS = [
  /\n/i,
  /\r/i,
  /%0[a-d]|%0[A-D]/i,
  /x-forwarded-(for|host|proto|port)/i,
  /x-real-ip/i,
  /x-http-method-override/i,
  /x-rewrite-url/i,
];

const REQUIRED_HEADERS = ["host"];
const FORBIDDEN_HEADERS = [
  "x-forwarded-for",
  "x-forwarded-host",
  "x-http-method-override",
  "x-rewrite-url",
  "proxy-authorization",
  "proxy-connection",
];

export class HeaderValidationRule extends BaseRule {
  private readonly requiredHeaders: string[];
  private readonly forbiddenHeaders: string[];
  private readonly suspiciousPatterns: RegExp[];
  private readonly maxHeaderCount: number;

  constructor(
    priority = 10,
    requiredHeaders = REQUIRED_HEADERS,
    forbiddenHeaders = FORBIDDEN_HEADERS,
    suspiciousPatterns = SUSPICIOUS_HEADER_PATTERNS,
    maxHeaderCount = 50,
    enabled = true,
  ) {
    super("header_validation", priority, enabled);
    this.requiredHeaders = requiredHeaders;
    this.forbiddenHeaders = forbiddenHeaders;
    this.suspiciousPatterns = suspiciousPatterns;
    this.maxHeaderCount = maxHeaderCount;
  }

  async evaluate(context: ProtectionContext): Promise<ProtectionDecision> {
    const headers = context.headers;
    const headerEntries = Object.entries(headers).filter(([, v]) => v !== undefined);

    if (headerEntries.length > this.maxHeaderCount) {
      return this.rejected(
        `Too many headers: ${headerEntries.length} (limit ${this.maxHeaderCount})`,
        "malformed_request",
        "medium",
        { headerCount: headerEntries.length, maxHeaderCount: this.maxHeaderCount },
      );
    }

    for (const required of this.requiredHeaders) {
      const found = Object.keys(headers).some((k) => k.toLowerCase() === required.toLowerCase());

      if (!found) {
        return this.rejected(
          `Missing required header: ${required}`,
          "malformed_request",
          "medium",
          { missingHeader: required },
        );
      }
    }

    for (const forbidden of this.forbiddenHeaders) {
      const found = Object.keys(headers).some((k) => k.toLowerCase() === forbidden.toLowerCase());

      if (found) {
        return this.rejected(
          `Forbidden header present: ${forbidden}`,
          "header_injection",
          "high",
          { forbiddenHeader: forbidden },
        );
      }
    }

    for (const [key, value] of headerEntries) {
      if (typeof value === "string") {
        for (const pattern of this.suspiciousPatterns) {
          if (pattern.test(value)) {
            return this.rejected(
              `Suspicious pattern detected in header "${key}"`,
              "header_injection",
              "high",
              { header: key, matchedPattern: pattern.source },
            );
          }
        }
      } else if (Array.isArray(value)) {
        for (const v of value) {
          for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(v)) {
              return this.rejected(
                `Suspicious pattern detected in header "${key}"`,
                "header_injection",
                "high",
                { header: key, matchedPattern: pattern.source },
              );
            }
          }
        }
      }
    }

    return this.allowed({ validatedHeaders: headerEntries.length });
  }
}
