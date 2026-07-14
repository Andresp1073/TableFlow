import { BaseLogger } from "./Logger.js";
import type { Logger, LogContext } from "../types.js";
import { LogLevel } from "../types.js";

export class NoopLogger extends BaseLogger {
  override log(_level: LogLevel, _message: string, _context?: LogContext): void {
  }

  override child(_context: Partial<LogContext>): Logger {
    return new NoopLogger();
  }
}
