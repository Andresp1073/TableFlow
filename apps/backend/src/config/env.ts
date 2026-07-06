import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function envString(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value !== undefined) return value;
  if (defaultValue !== undefined) return defaultValue;
  throw new Error(`Missing required environment variable: ${key}`);
}

function envNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value && defaultValue !== undefined) return defaultValue;
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable: ${key}`);
  }
  return parsed;
}

function envBoolean(key: string, defaultValue?: boolean): boolean {
  const value = process.env[key];
  if (!value && defaultValue !== undefined) return defaultValue;
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value === 'true' || value === '1';
}

function buildDatabaseUrl(): string {
  const host = process.env.DATABASE_HOST ?? 'localhost';
  const port = process.env.DATABASE_PORT ?? '3306';
  const name = process.env.DATABASE_NAME ?? 'tableflow';
  const user = process.env.DATABASE_USER ?? 'root';
  const password = process.env.DATABASE_PASSWORD ?? 'password';

  return process.env.DATABASE_URL ?? `mysql://${user}:${password}@${host}:${port}/${name}`;
}

export const env = {
  NODE_ENV: envString('NODE_ENV', 'development'),
  PORT: envNumber('PORT', 4000),
  HOST: envString('HOST', '0.0.0.0'),

  DATABASE_URL: buildDatabaseUrl(),
  DATABASE_HOST: envString('DATABASE_HOST', 'localhost'),
  DATABASE_PORT: envString('DATABASE_PORT', '3306'),
  DATABASE_NAME: envString('DATABASE_NAME', 'tableflow'),
  DATABASE_USER: envString('DATABASE_USER', 'root'),
  DATABASE_PASSWORD: envString('DATABASE_PASSWORD', 'password'),

  DB_POOL_MIN: envNumber('DB_POOL_MIN', 2),
  DB_POOL_MAX: envNumber('DB_POOL_MAX', 10),
  DB_SLOW_QUERY_THRESHOLD_MS: envNumber('DB_SLOW_QUERY_THRESHOLD_MS', 500),

  JWT_SECRET: envString('JWT_SECRET', 'change-me-in-production'),
  JWT_EXPIRES_IN: envString('JWT_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: envString('JWT_REFRESH_EXPIRES_IN', '7d'),

  CORS_ORIGIN: envString('CORS_ORIGIN', 'http://localhost:3000'),

  LOG_LEVEL: envString('LOG_LEVEL', 'info'),
  LOG_PRETTY: envBoolean('LOG_PRETTY', true),

  RATE_LIMIT_MAX: envNumber('RATE_LIMIT_MAX', 200),
  RATE_LIMIT_WINDOW_MS: envNumber('RATE_LIMIT_WINDOW_MS', 60_000),
  AUTH_RATE_LIMIT_MAX: envNumber('AUTH_RATE_LIMIT_MAX', 10),
  AUTH_RATE_LIMIT_WINDOW_MS: envNumber('AUTH_RATE_LIMIT_WINDOW_MS', 60_000),

  AUTH_MAX_LOGIN_ATTEMPTS: envNumber('AUTH_MAX_LOGIN_ATTEMPTS', 5),
  AUTH_LOCKOUT_MINUTES: envNumber('AUTH_LOCKOUT_MINUTES', 30),
  AUTH_RESET_ATTEMPTS_AFTER: envNumber('AUTH_RESET_ATTEMPTS_AFTER', 15),

  SMTP_HOST: envString('SMTP_HOST', 'localhost'),
  SMTP_PORT: envNumber('SMTP_PORT', 587),
  SMTP_USER: envString('SMTP_USER', ''),
  SMTP_PASSWORD: envString('SMTP_PASSWORD', ''),
  SMTP_FROM: envString('SMTP_FROM', 'noreply@tableflow.io'),
  FRONTEND_URL: envString('FRONTEND_URL', 'http://localhost:3000'),

  VERIFICATION_REQUIRED: envBoolean('VERIFICATION_REQUIRED', false),

  TZ: envString('TZ', 'UTC'),

  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};
