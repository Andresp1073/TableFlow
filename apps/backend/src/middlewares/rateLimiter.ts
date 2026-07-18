import type { Request, Response, NextFunction } from 'express';
import { TooManyRequestsError } from '../errors/TooManyRequestsError.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

export function rateLimiter(options: RateLimiterOptions) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const key = req.ip ?? req.requestId ?? 'global';
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (entry.count >= options.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

      next(new TooManyRequestsError(retryAfter));
      return;
    }

    entry.count += 1;
    next();
  };
}
