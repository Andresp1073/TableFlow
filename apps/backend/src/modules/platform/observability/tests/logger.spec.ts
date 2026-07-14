import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConsoleLogger } from "../logger/ConsoleLogger.js";
import { NoopLogger } from "../logger/NoopLogger.js";
import { BaseLogger } from "../logger/Logger.js";
import { LogLevel } from "../types.js";
import type { LogContext, Logger, LogEntry } from "../types.js";

describe("LogLevel", () => {
  it("defines all log levels", () => {
    expect(LogLevel.DEBUG).toBe("debug");
    expect(LogLevel.INFO).toBe("info");
    expect(LogLevel.WARN).toBe("warn");
    expect(LogLevel.ERROR).toBe("error");
    expect(LogLevel.FATAL).toBe("fatal");
  });
});

describe("BaseLogger", () => {
  it("provides convenience methods that delegate to log()", () => {
    const spy = vi.fn();

    class TestLogger extends BaseLogger {
      log(level: LogLevel, message: string, context?: LogContext): void {
        spy(level, message, context);
      }

      child(context: Partial<LogContext>): Logger {
        return new TestLogger(context);
      }
    }

    const logger = new TestLogger();

    logger.debug("debug msg");
    logger.info("info msg");
    logger.warn("warn msg");
    logger.error("error msg");
    logger.fatal("fatal msg");

    expect(spy).toHaveBeenCalledTimes(5);
    expect(spy).toHaveBeenCalledWith(LogLevel.DEBUG, "debug msg", undefined);
    expect(spy).toHaveBeenCalledWith(LogLevel.INFO, "info msg", undefined);
    expect(spy).toHaveBeenCalledWith(LogLevel.WARN, "warn msg", undefined);
    expect(spy).toHaveBeenCalledWith(LogLevel.ERROR, "error msg", undefined);
    expect(spy).toHaveBeenCalledWith(LogLevel.FATAL, "fatal msg", undefined);
  });
});

describe("NoopLogger", () => {
  it("does not throw when logging", () => {
    const logger = new NoopLogger();

    expect(() => {
      logger.debug("test");
      logger.info("test");
      logger.warn("test");
      logger.error("test");
      logger.fatal("test");
      logger.log(LogLevel.INFO, "test");
    }).not.toThrow();
  });

  it("returns a NoopLogger from child()", () => {
    const logger = new NoopLogger();
    const child = logger.child({ requestId: "req-1" });

    expect(child).toBeInstanceOf(NoopLogger);
  });
});

describe("ConsoleLogger", () => {
  let stdoutWrite: typeof process.stdout.write;
  let stderrWrite: typeof process.stderr.write;
  let stdoutSpy: ReturnType<typeof vi.fn>;
  let stderrSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    stdoutWrite = process.stdout.write;
    stderrWrite = process.stderr.write;
    stdoutSpy = vi.fn();
    stderrSpy = vi.fn();
    process.stdout.write = stdoutSpy as unknown as typeof process.stdout.write;
    process.stderr.write = stderrSpy as unknown as typeof process.stderr.write;
  });

  afterEach(() => {
    process.stdout.write = stdoutWrite;
    process.stderr.write = stderrWrite;
  });

  it("logs JSON to stdout for info level", () => {
    const logger = new ConsoleLogger();

    logger.info("hello world");

    expect(stdoutSpy).toHaveBeenCalledTimes(1);

    const output = stdoutSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output.trim()) as LogEntry;

    expect(parsed.level).toBe(LogLevel.INFO);
    expect(parsed.message).toBe("hello world");
    expect(parsed.timestamp).toBeDefined();
  });

  it("logs JSON to stderr for error level", () => {
    const logger = new ConsoleLogger();

    logger.error("an error occurred");

    expect(stderrSpy).toHaveBeenCalledTimes(1);

    const output = stderrSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output.trim()) as LogEntry;

    expect(parsed.level).toBe(LogLevel.ERROR);
    expect(parsed.message).toBe("an error occurred");
  });

  it("includes context fields in the log entry", () => {
    const logger = new ConsoleLogger({ requestId: "req-123", userId: "user-1" });

    logger.info("context test", { operation: "test-op" });

    const output = stdoutSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output.trim()) as LogEntry;

    expect(parsed.requestId).toBe("req-123");
    expect(parsed.userId).toBe("user-1");
    expect(parsed.operation).toBe("test-op");
  });

  it("filters log entries below min level", () => {
    const logger = new ConsoleLogger(undefined, LogLevel.WARN);

    logger.debug("should not appear");
    logger.info("should not appear");
    logger.warn("should appear");
    logger.error("should appear");

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    expect(stderrSpy).toHaveBeenCalledTimes(1);
  });

  it("creates a child logger with merged context", () => {
    const logger = new ConsoleLogger({ restaurantId: "rest-1" });
    const child = logger.child({ userId: "user-2" });

    child.info("child test");

    const output = stdoutSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output.trim()) as LogEntry;

    expect(parsed.restaurantId).toBe("rest-1");
    expect(parsed.userId).toBe("user-2");
  });

  it("prints pretty format when enabled", () => {
    const logger = new ConsoleLogger(undefined, LogLevel.DEBUG, true);

    logger.info("pretty test", { operation: "test" });

    expect(stdoutSpy).toHaveBeenCalledTimes(1);

    const output = stdoutSpy.mock.calls[0]?.[0] as string;

    expect(output).toContain("[INFO]");
    expect(output).toContain("pretty test");
    expect(output).toContain("op=test");
  });

  it("handles log() directly", () => {
    const logger = new ConsoleLogger();

    logger.log(LogLevel.WARN, "direct log call");

    const output = stdoutSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output.trim()) as LogEntry;

    expect(parsed.level).toBe(LogLevel.WARN);
    expect(parsed.message).toBe("direct log call");
  });

  it("supports traceId in context", () => {
    const logger = new ConsoleLogger({ traceId: "trace-abc" });

    logger.info("traced");

    const output = stdoutSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output.trim()) as LogEntry;

    expect(parsed.traceId).toBe("trace-abc");
  });

  it("supports correlationId in context", () => {
    const logger = new ConsoleLogger({ correlationId: "corr-xyz" });

    logger.info("correlated");

    const output = stdoutSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output.trim()) as LogEntry;

    expect(parsed.correlationId).toBe("corr-xyz");
  });

  it("supports duration in context", () => {
    const logger = new ConsoleLogger();

    logger.info("timed", { duration: 42 });

    const output = stdoutSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output.trim()) as LogEntry;

    expect(parsed.duration).toBe(42);
  });

  it("supports metadata", () => {
    const logger = new ConsoleLogger({ metadata: { source: "test" } });

    logger.info("meta");

    const output = stdoutSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output.trim()) as LogEntry;

    expect(parsed.metadata).toEqual({ source: "test" });
  });

  it("supports error in context", () => {
    const logger = new ConsoleLogger();

    logger.error("something failed", {
      error: { name: "TestError", message: "test message", stack: "stack trace" },
    });

    const output = stderrSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output.trim()) as LogEntry;

    expect(parsed.error?.name).toBe("TestError");
    expect(parsed.error?.message).toBe("test message");
    expect(parsed.error?.stack).toBe("stack trace");
  });
});
