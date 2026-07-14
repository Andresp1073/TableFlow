import { inspect } from "node:util";
import { BaseLogger } from "./Logger.js";
import type { Logger, LogContext, LogEntry } from "../types.js";
import { LogLevel } from "../types.js";

export class ConsoleLogger extends BaseLogger {
  private readonly minLevel: LogLevel;
  private readonly prettyPrint: boolean;

  constructor(context?: LogContext, minLevel: LogLevel = LogLevel.DEBUG, prettyPrint = false) {
    super(context);
    this.minLevel = minLevel;
    this.prettyPrint = prettyPrint;
  }

  override log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.buildEntry(level, message, context);

    if (this.prettyPrint) {
      this.writePretty(entry);
    } else {
      this.writeJSON(entry);
    }
  }

  override child(context: Partial<LogContext>): Logger {
    const merged: LogContext = { ...this.context, ...context };
    return new ConsoleLogger(merged, this.minLevel, this.prettyPrint);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private buildEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...context,
      metadata: {
        ...(this.context.metadata as Record<string, unknown> | undefined),
        ...(context?.metadata as Record<string, unknown> | undefined),
      },
    };
  }

  private writeJSON(entry: LogEntry): void {
    const output = JSON.stringify(entry);

    switch (entry.level) {
      case LogLevel.ERROR:
      case LogLevel.FATAL: {
        process.stderr.write(output + "\n");
        return;
      }
      default: {
        process.stdout.write(output + "\n");
      }
    }
  }

  private writePretty(entry: LogEntry): void {
    const timestamp = entry.timestamp;
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;

    if (entry.error) {
      const errText = `error=${entry.error.name}: ${entry.error.message}`;
      const line = `${prefix} ${entry.message} ${this.formatContext(entry)} ${errText}`;

      process.stderr.write(line + "\n");
      if (entry.error.stack) {
        process.stderr.write(entry.error.stack + "\n");
      }
      return;
    }

    const line = `${prefix} ${entry.message} ${this.formatContext(entry)}`;

    switch (entry.level) {
      case LogLevel.ERROR:
      case LogLevel.FATAL: {
        process.stderr.write(line + "\n");
        return;
      }
      default: {
        process.stdout.write(line + "\n");
      }
    }
  }

  private formatContext(entry: LogEntry): string {
    const parts: string[] = [];

    if (entry.traceId) {
      parts.push(`trace=${entry.traceId}`);
    }
    if (entry.requestId) {
      parts.push(`req=${entry.requestId}`);
    }
    if (entry.correlationId) {
      parts.push(`corr=${entry.correlationId}`);
    }
    if (entry.userId) {
      parts.push(`user=${entry.userId}`);
    }
    if (entry.restaurantId) {
      parts.push(`rest=${entry.restaurantId}`);
    }
    if (entry.operation) {
      parts.push(`op=${entry.operation}`);
    }
    if (entry.duration !== undefined) {
      parts.push(`dur=${entry.duration}ms`);
    }

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      parts.push(inspect(entry.metadata, { compact: true, breakLength: Infinity }));
    }

    return parts.length > 0 ? parts.join(" ") : "";
  }
}
