export const APP = {
  NAME: 'TableFlow',
  VERSION: '1.0.0',
  API_PREFIX: '/api/v1',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const RATE_LIMIT = {
  WINDOW_MS: 60_000,
  MAX_REQUESTS: 200,
} as const;

export const JSON_LIMIT = '1mb';

export const TIMEZONE_DEFAULT = 'UTC';
