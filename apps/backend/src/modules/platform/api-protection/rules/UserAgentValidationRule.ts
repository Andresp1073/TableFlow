import { BaseRule } from "./ProtectionRule.js";
import type { ProtectionContext, ProtectionDecision } from "../types.js";

const MALICIOUS_USER_AGENT_PATTERNS = [
  /curl\//i,
  /wget/i,
  /python-requests/i,
  /python-urllib/i,
  /go-http-client/i,
  /ruby/i,
  /perl/i,
  /libwww/i,
  /scrapy/i,
  /httpclient/i,
  /okhttp/i,
  /Java\/[\d.]+/i,
  /node-fetch/i,
  /axios/i,
  /postman/i,
  /insomnia/i,
  /Fiddler/i,
  /Burp/i,
  /ZAP/i,
  /nikto/i,
  /nmap/i,
  /sqlmap/i,
  /masscan/i,
  /zgrab/i,
  /wpscan/i,
  /acunetix/i,
  /netsparker/i,
  /appscan/i,
  /arachni/i,
  /webinspect/i,
];

const BLANK_UA_PATTERNS = [
  /^$/,
  /^null$/i,
  /^undefined$/i,
  /^-$/,
];

export class UserAgentValidationRule extends BaseRule {
  private readonly maliciousPatterns: RegExp[];
  private readonly blankPatterns: RegExp[];
  private readonly blockBlank: boolean;
  private readonly blockKnownMalicious: boolean;

  constructor(
    priority = 60,
    maliciousPatterns = MALICIOUS_USER_AGENT_PATTERNS,
    blankPatterns = BLANK_UA_PATTERNS,
    blockBlank = false,
    blockKnownMalicious = false,
    enabled = true,
  ) {
    super("user_agent_validation", priority, enabled);
    this.maliciousPatterns = maliciousPatterns;
    this.blankPatterns = blankPatterns;
    this.blockBlank = blockBlank;
    this.blockKnownMalicious = blockKnownMalicious;
  }

  async evaluate(context: ProtectionContext): Promise<ProtectionDecision> {
    const userAgent = context.userAgent;

    if (!userAgent || userAgent === "") {
      if (this.blockBlank) {
        return this.rejected(
          "Missing User-Agent header",
          "malformed_request",
          "low",
        );
      }

      return this.warning(
        "Missing User-Agent header",
        "request_anomaly",
        "low",
      );
    }

    for (const pattern of this.blankPatterns) {
      if (pattern.test(userAgent)) {
        return this.warning(
          `Suspicious User-Agent value: "${userAgent}"`,
          "malicious_user_agent",
          "low",
          { userAgent },
        );
      }
    }

    if (this.blockKnownMalicious) {
      for (const pattern of this.maliciousPatterns) {
        if (pattern.test(userAgent)) {
          return this.rejected(
            `Known malicious User-Agent blocked: ${userAgent.slice(0, 100)}`,
            "malicious_user_agent",
            "high",
            { userAgent: userAgent.slice(0, 200), matchedPattern: pattern.source },
          );
        }
      }
    }

    return this.allowed({ userAgent: userAgent.slice(0, 100) });
  }
}
