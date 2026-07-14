import type {
  RequestSecurityAnalyzer as RequestSecurityAnalyzerInterface,
  RequestAnalysisResult,
  RequestData,
  ThreatFinding,
  ThreatType,
} from "./types.js";

const SUSPICIOUS_IP_PATTERNS = [
  /^0\./,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

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
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.\\/,
  /\.\.\%5c/i,
  /\.\.\%2f/i,
  /~root/,
  /~\.\./,
  /\%00/,
];

const MALFORMED_JSON_PATTERNS = [
  /[^\x20-\x7E\x09\x0A\x0D]/,
];

const VALID_HTTP_METHODS = new Set([
  "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "TRACE", "CONNECT",
]);

const SUSPICIOUS_METHODS = new Set(["TRACE", "CONNECT"]);

const MAX_CONTENT_LENGTH = 10 * 1024 * 1024;

export class RequestSecurityAnalyzer implements RequestSecurityAnalyzerInterface {
  private readonly maxContentLength: number;

  constructor(maxContentLength = MAX_CONTENT_LENGTH) {
    this.maxContentLength = maxContentLength;
  }

  async analyze(request: RequestData): Promise<RequestAnalysisResult> {
    const threats: ThreatFinding[] = [];

    this.checkMethod(request, threats);
    this.checkContentType(request, threats);
    this.checkContentLength(request, threats);
    this.checkRequiredHeaders(request, threats);
    this.checkIpAddress(request, threats);
    this.checkQueryParameters(request, threats);
    this.checkBody(request, threats);

    return {
      passed: threats.length === 0,
      threats,
    };
  }

  private checkMethod(request: RequestData, threats: ThreatFinding[]): void {
    const method = request.method.toUpperCase();

    if (!VALID_HTTP_METHODS.has(method)) {
      threats.push({
        type: "unexpected_method",
        severity: "high",
        message: `Unexpected HTTP method: ${method}`,
        details: { method },
      });
      return;
    }

    if (SUSPICIOUS_METHODS.has(method)) {
      threats.push({
        type: "unexpected_method",
        severity: "medium",
        message: `Potentially dangerous HTTP method: ${method}`,
        details: { method },
      });
    }
  }

  private checkContentType(request: RequestData, threats: ThreatFinding[]): void {
    if (!request.contentType && (request.method === "POST" || request.method === "PUT" || request.method === "PATCH")) {
      threats.push({
        type: "invalid_content_type",
        severity: "medium",
        message: "Missing Content-Type header for mutation request",
        details: { method: request.method },
      });
      return;
    }

    if (request.contentType) {
      const validTypes = [
        "application/json",
        "application/x-www-form-urlencoded",
        "multipart/form-data",
        "text/plain",
        "application/xml",
        "text/xml",
      ];

      const contentTypeLower = request.contentType.toLowerCase();

      const isValid = validTypes.some((t) => contentTypeLower.startsWith(t));

      if (!isValid) {
        threats.push({
          type: "invalid_content_type",
          severity: "high",
          message: `Invalid Content-Type: ${request.contentType}`,
          details: { contentType: request.contentType },
        });
      }
    }
  }

  private checkContentLength(request: RequestData, threats: ThreatFinding[]): void {
    if (request.contentLength !== undefined && request.contentLength > this.maxContentLength) {
      threats.push({
        type: "oversized_payload",
        severity: "medium",
        message: `Request content length (${request.contentLength} bytes) exceeds maximum (${this.maxContentLength} bytes)`,
        details: { contentLength: request.contentLength, maxLength: this.maxContentLength },
      });
    }
  }

  private checkRequiredHeaders(request: RequestData, threats: ThreatFinding[]): void {
    const hasContentType = request.contentType !== undefined || request.headers["content-type"] !== undefined;
    const hasHost = request.headers["host"] !== undefined;
    const hasUserAgent = request.headers["user-agent"] !== undefined;

    if (!hasContentType && (request.method === "POST" || request.method === "PUT" || request.method === "PATCH")) {
      threats.push({
        type: "missing_header",
        severity: "low",
        message: "Missing Content-Type header",
        details: { method: request.method },
      });
    }

    if (!hasHost) {
      threats.push({
        type: "missing_header",
        severity: "low",
        message: "Missing Host header",
      });
    }

    if (!hasUserAgent) {
      threats.push({
        type: "missing_header",
        severity: "low",
        message: "Missing User-Agent header",
      });
    }
  }

  private checkIpAddress(request: RequestData, threats: ThreatFinding[]): void {
    if (!request.ip) {
      return;
    }

    for (const pattern of SUSPICIOUS_IP_PATTERNS) {
      if (pattern.test(request.ip)) {
        threats.push({
          type: "suspicious_pattern",
          severity: "low",
          message: `Request from internal/private IP: ${request.ip}`,
          details: { ip: request.ip },
        });
        return;
      }
    }
  }

  private checkQueryParameters(request: RequestData, threats: ThreatFinding[]): void {
    if (!request.query) {
      return;
    }

    for (const [key, value] of Object.entries(request.query)) {
      if (typeof value === "string") {
        this.checkForInjections(key, value, "query", threats);
      } else if (Array.isArray(value)) {
        for (const v of value) {
          if (typeof v === "string") {
            this.checkForInjections(key, v, "query", threats);
          }
        }
      }
    }
  }

  private checkBody(request: RequestData, threats: ThreatFinding[]): void {
    if (request.body === null || request.body === undefined) {
      return;
    }

    if (typeof request.body === "string") {
      this.checkForInjections("body", request.body, "body", threats);
    } else if (typeof request.body === "object") {
      this.deepCheckObject(request.body as Record<string, unknown>, "body", threats);
    }
  }

  private checkForInjections(field: string, value: string, location: string, threats: ThreatFinding[]): void {
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(value)) {
        threats.push({
          type: "sql_injection_attempt",
          severity: "critical",
          message: `SQL injection pattern detected in ${location} field "${field}"`,
          details: { field, location, matchedPattern: pattern.source, value: value.slice(0, 200) },
        });
        return;
      }
    }

    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(value)) {
        threats.push({
          type: "xss_attempt",
          severity: "critical",
          message: `XSS pattern detected in ${location} field "${field}"`,
          details: { field, location, matchedPattern: pattern.source, value: value.slice(0, 200) },
        });
        return;
      }
    }

    for (const pattern of PATH_TRAVERSAL_PATTERNS) {
      if (pattern.test(value)) {
        threats.push({
          type: "path_traversal_attempt",
          severity: "high",
          message: `Path traversal pattern detected in ${location} field "${field}"`,
          details: { field, location, matchedPattern: pattern.source, value: value.slice(0, 200) },
        });
        return;
      }
    }
  }

  private deepCheckObject(obj: Record<string, unknown>, prefix: string, threats: ThreatFinding[]): void {
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = `${prefix}.${key}`;

      if (typeof value === "string") {
        this.checkForInjections(key, value, fieldPath, threats);
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        this.deepCheckObject(value as Record<string, unknown>, fieldPath, threats);
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const item = value[i];

          if (typeof item === "string") {
            this.checkForInjections(key, item, `${fieldPath}[${i}]`, threats);
          } else if (typeof item === "object" && item !== null) {
            this.deepCheckObject(item as Record<string, unknown>, `${fieldPath}[${i}]`, threats);
          }
        }
      }
    }
  }
}
