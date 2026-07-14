import { BaseRule } from "./ProtectionRule.js";
import type { ProtectionContext, ProtectionDecision } from "../types.js";

const SUSPICIOUS_TLDS = [".xyz", ".top", ".click", ".download", ".review", ".site", ".win", ".bid"];
const ALLOWED_SCHEMES = ["https", "http"];

export class OriginValidationRule extends BaseRule {
  private readonly allowedOrigins: string[];
  private readonly suspiciousTlds: string[];
  private readonly allowedSchemes: string[];
  private readonly strictMode: boolean;

  constructor(
    priority = 50,
    allowedOrigins: string[] = [],
    suspiciousTlds = SUSPICIOUS_TLDS,
    allowedSchemes = ALLOWED_SCHEMES,
    strictMode = false,
    enabled = true,
  ) {
    super("origin_validation", priority, enabled);
    this.allowedOrigins = allowedOrigins;
    this.suspiciousTlds = suspiciousTlds;
    this.allowedSchemes = allowedSchemes;
    this.strictMode = strictMode;
  }

  async evaluate(context: ProtectionContext): Promise<ProtectionDecision> {
    const origin = context.origin;
    const referer = context.referer;
    const source = origin || referer;

    if (!source) {
      if (this.strictMode) {
        return this.warning(
          "Request missing Origin and Referer headers",
          "request_anomaly",
          "low",
        );
      }

      return this.skip("No origin or referer to validate");
    }

    if (origin && this.allowedOrigins.length > 0) {
      const isAllowed = this.allowedOrigins.some((allowed) => {
        if (allowed.includes("*")) {
          const pattern = allowed.replace(/\*/g, ".*");

          return new RegExp(`^${pattern}$`, "i").test(origin);
        }

        return origin.toLowerCase() === allowed.toLowerCase();
      });

      if (!isAllowed) {
        return this.rejected(
          `Origin not allowed: ${origin}`,
          "suspicious_origin",
          "medium",
          { origin, allowedOrigins: this.allowedOrigins },
        );
      }
    }

    try {
      const url = new URL(source);

      if (!this.allowedSchemes.includes(url.protocol.replace(":", "").toLowerCase())) {
        return this.rejected(
          `Invalid origin scheme: ${url.protocol}`,
          "suspicious_origin",
          "high",
          { origin: source, scheme: url.protocol },
        );
      }

      const tld = "." + url.hostname.split(".").pop()?.toLowerCase();

      if (tld && this.suspiciousTlds.includes(tld)) {
        return this.warning(
          `Suspicious origin TLD: ${tld} (${source})`,
          "suspicious_origin",
          "low",
          { origin: source, tld },
        );
      }
    } catch {
      return this.rejected(
        `Malformed origin URL: ${source}`,
        "malformed_request",
        "medium",
        { origin: source },
      );
    }

    return this.allowed({ source });
  }
}
