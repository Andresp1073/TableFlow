import type { Logger, LogContext } from "../types.js";
import { LogLevel } from "../types.js";

export abstract class BaseLogger implements Logger {
  protected readonly context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  fatal(message: string, context?: LogContext): void {
    this.log(LogLevel.FATAL, message, context);
  }

  abstract log(level: LogLevel, message: string, context?: LogContext): void;
  abstract child(context: Partial<LogContext>): Logger;
}
