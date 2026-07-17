export const APP_NAME = 'TableFlow';
export const APP_DESCRIPTION = 'Multi-restaurant reservation SaaS platform';
export const APP_VERSION = '1.0.0';

export const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api';

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZES: [10, 20, 50, 100],
} as const;

export const DEBOUNCE = {
  SEARCH: 300,
  VALIDATION: 500,
  RESIZE: 200,
} as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
} as const;
