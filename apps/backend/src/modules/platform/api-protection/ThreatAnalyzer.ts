import type { ThreatAnalyzer as ThreatAnalyzerInterface, ThreatAnalysis, ThreatFinding, ProtectionContext, ThreatCategory } from "./types.js";

const SQL_INJECTION_PATTERNS = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /\b(select|insert|update|delete|drop|alter|truncate|exec|execute)\b.+\b(from|into|set|where|table|database|values)\b/i,
  /(\bunion\b\s+\bselect\b)/i,
  /(\b(and|or)\b\s+\d+\s*=\s*\d+)/i,
  /'\s*(or|and|union|select)\s*['(]/i,
];

const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/is,
  /onerror\s*=/i,
  /onload\s*=/i,
  /onclick\s*=/i,
  /onmouseover\s*=/i,
  /javascript\s*:/i,
  /<iframe[^>]*>/i,
  /<embed[^>]*>/i,
  /<object[^>]*>/i,
  /<svg[^>]*>/i,
  /expression\s*\(/i,
  /alert\s*\(/i,
  /prompt\s*\(/i,
  /confirm\s*\(/i,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.\\/,
  /\.\.\%5[cC]/i,
  /\.\.\%2[fF]/i,
  /~root/,
  /~\.\./,
  /\%00/,
  /\%0[0-8b-f]/i,
  /\.\.\/\.\.\//,
];

const SUSPICIOUS_QUERY_PATTERNS = [
  /__proto__/i,
  /constructor/i,
  /prototype/i,
  /\.env/i,
  /proc\/self\//i,
  /etc\/passwd/i,
  /etc\/shadow/i,
  /\/\.git\//i,
  /\/\.aws\//i,
  /\/\.ssh\//i,
  /\/config\./i,
  /admin/i,
  /backup/i,
  /dump/i,
  /debug/i,
  /test/i,
];

const MALFORMED_REQUEST_PATTERNS = [
  /[^\x20-\x7E\x09\x0A\x0D]/,
];

export class ThreatAnalyzer implements ThreatAnalyzerInterface {
  private readonly sqlPatterns: RegExp[];
  private readonly xssPatterns: RegExp[];
  private readonly traversalPatterns: RegExp[];
  private readonly suspiciousQueryPatterns: RegExp[];
  private readonly malformedPatterns: RegExp[];

  constructor(
    sqlPatterns = SQL_INJECTION_PATTERNS,
    xssPatterns = XSS_PATTERNS,
    traversalPatterns = PATH_TRAVERSAL_PATTERNS,
    suspiciousQueryPatterns = SUSPICIOUS_QUERY_PATTERNS,
    malformedPatterns = MALFORMED_REQUEST_PATTERNS,
  ) {
    this.sqlPatterns = sqlPatterns;
    this.xssPatterns = xssPatterns;
    this.traversalPatterns = traversalPatterns;
    this.suspiciousQueryPatterns = suspiciousQueryPatterns;
    this.malformedPatterns = malformedPatterns;
  }

  async analyze(context: ProtectionContext): Promise<ThreatAnalysis> {
    const threats: ThreatFinding[] = [];

    this.checkQueryParameters(context, threats);
    this.checkBody(context, threats);
    this.checkPath(context, threats);
    this.checkRequestAnomalies(context, threats);

    const riskScore = this.calculateRiskScore(threats);

    return { threats, riskScore };
  }

  private checkQueryParameters(context: ProtectionContext, threats: ThreatFinding[]): void {
    const query = context.query;

    if (!query) {
      return;
    }

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string") {
        this.scanForThreats(key, value, `query.${key}`, threats);
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] === "string") {
            this.scanForThreats(key, value[i], `query.${key}[${i}]`, threats);
          }
        }
      }
    }

    for (const [key] of Object.entries(query)) {
      for (const pattern of this.suspiciousQueryPatterns) {
        if (pattern.test(key)) {
          threats.push({
            category: "request_anomaly",
            severity: "medium",
            message: `Suspicious query parameter name: "${key}"`,
            field: `query.${key}`,
            details: { parameter: key, matchedPattern: pattern.source },
          });
        }
      }
    }
  }

  private checkBody(context: ProtectionContext, threats: ThreatFinding[]): void {
    if (context.body === null || context.body === undefined) {
      return;
    }

    if (typeof context.body === "string") {
      this.scanForThreats("body", context.body, "body", threats);
    } else if (typeof context.body === "object") {
      this.deepScanObject(context.body as Record<string, unknown>, "body", threats);
    }
  }

  private checkPath(context: ProtectionContext, threats: ThreatFinding[]): void {
    for (const pattern of this.traversalPatterns) {
      if (pattern.test(context.path)) {
        threats.push({
          category: "path_traversal",
          severity: "high",
          message: `Path traversal pattern detected in request path`,
          field: "path",
          details: { path: context.path, matchedPattern: pattern.source },
        });

        return;
      }
    }
  }

  private checkRequestAnomalies(context: ProtectionContext, threats: ThreatFinding[]): void {
    if (context.contentLength !== undefined && context.contentLength > 0 && !context.contentType) {
      threats.push({
        category: "request_anomaly",
        severity: "low",
        message: "Request has body but no Content-Type header",
        details: { contentLength: context.contentLength },
      });
    }

    const contentType = context.contentType?.toLowerCase() ?? "";

    if (contentType.includes("application/json") || contentType.includes("multipart/form-data")) {
      if (context.body && typeof context.body === "string") {
        for (const pattern of this.malformedPatterns) {
          if (pattern.test(context.body as string)) {
            threats.push({
              category: "malformed_request",
              severity: "medium",
              message: "Malformed characters detected in request body",
              details: { contentType },
            });

            return;
          }
        }
      }
    }
  }

  private scanForThreats(fieldName: string, value: string, location: string, threats: ThreatFinding[]): void {
    for (const pattern of this.sqlPatterns) {
      if (pattern.test(value)) {
        threats.push({
          category: "sql_injection",
          severity: "critical",
          message: `SQL injection pattern detected in ${location}`,
          field: location,
          details: { field: fieldName, location, matchedPattern: pattern.source, value: value.slice(0, 200) },
        });

        return;
      }
    }

    for (const pattern of this.xssPatterns) {
      if (pattern.test(value)) {
        threats.push({
          category: "xss",
          severity: "critical",
          message: `XSS pattern detected in ${location}`,
          field: location,
          details: { field: fieldName, location, matchedPattern: pattern.source, value: value.slice(0, 200) },
        });

        return;
      }
    }

    for (const pattern of this.traversalPatterns) {
      if (pattern.test(value)) {
        threats.push({
          category: "path_traversal",
          severity: "high",
          message: `Path traversal pattern detected in ${location}`,
          field: location,
          details: { field: fieldName, location, matchedPattern: pattern.source, value: value.slice(0, 200) },
        });

        return;
      }
    }
  }

  private deepScanObject(obj: Record<string, unknown>, prefix: string, threats: ThreatFinding[]): void {
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = `${prefix}.${key}`;

      if (typeof value === "string") {
        this.scanForThreats(key, value, fieldPath, threats);
      } else if (typeof value === "object" && value !== null) {
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            const item = value[i];

            if (typeof item === "string") {
              this.scanForThreats(key, item, `${fieldPath}[${i}]`, threats);
            } else if (typeof item === "object" && item !== null) {
              this.deepScanObject(item as Record<string, unknown>, `${fieldPath}[${i}]`, threats);
            }
          }
        } else {
          this.deepScanObject(value as Record<string, unknown>, fieldPath, threats);
        }
      }
    }
  }

  private calculateRiskScore(threats: ThreatFinding[]): number {
    if (threats.length === 0) {
      return 0;
    }

    const severityWeights: Record<string, number> = {
      low: 1,
      medium: 3,
      high: 7,
      critical: 15,
    };

    let score = 0;

    for (const threat of threats) {
      score += severityWeights[threat.severity] ?? 1;
    }

    return Math.min(score, 100);
  }
}
