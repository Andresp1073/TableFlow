export const colors = {
  primary: {
    50: 'hsl(var(--primary-50))',
    100: 'hsl(var(--primary-100))',
    200: 'hsl(var(--primary-200))',
    300: 'hsl(var(--primary-300))',
    400: 'hsl(var(--primary-400))',
    500: 'hsl(var(--primary-500))',
    600: 'hsl(var(--primary-600))',
    700: 'hsl(var(--primary-700))',
    800: 'hsl(var(--primary-800))',
    900: 'hsl(var(--primary-900))',
    950: 'hsl(var(--primary-950))',
  },
  success: {
    50: 'hsl(var(--success-50))',
    100: 'hsl(var(--success-100))',
    400: 'hsl(var(--success-400))',
    500: 'hsl(var(--success-500))',
    600: 'hsl(var(--success-600))',
    700: 'hsl(var(--success-700))',
  },
  warning: {
    50: 'hsl(var(--warning-50))',
    100: 'hsl(var(--warning-100))',
    400: 'hsl(var(--warning-400))',
    500: 'hsl(var(--warning-500))',
    600: 'hsl(var(--warning-600))',
    700: 'hsl(var(--warning-700))',
  },
  error: {
    50: 'hsl(var(--error-50))',
    100: 'hsl(var(--error-100))',
    400: 'hsl(var(--error-400))',
    500: 'hsl(var(--error-500))',
    600: 'hsl(var(--error-600))',
    700: 'hsl(var(--error-700))',
  },
} as const;

export const spacing = {
  0.5: '2px',
  1.5: '6px',
  2.5: '10px',
  3.5: '14px',
  4.5: '18px',
} as const;

export const radius = {
  none: '0',
  xs: '2px',
  sm: '4px',
  DEFAULT: '6px',
  md: '8px',
  lg: '10px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '20px',
  full: '9999px',
} as const;

export const shadow = {
  xs: '0px 1px 2px hsl(var(--shadow-xs))',
  sm: '0px 1px 3px hsl(var(--shadow-sm))',
  DEFAULT: '0px 2px 4px hsl(var(--shadow-default))',
  md: '0px 4px 8px hsl(var(--shadow-md))',
  lg: '0px 8px 16px hsl(var(--shadow-lg))',
  xl: '0px 12px 24px hsl(var(--shadow-xl))',
  '2xl': '0px 24px 48px hsl(var(--shadow-2xl))',
} as const;

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  toast: 1070,
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Theme = 'light' | 'dark' | 'system' | 'high-contrast';
export type ColorScheme = 'light' | 'dark';

export function getSystemTheme(): ColorScheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveTheme(theme: Theme): ColorScheme {
  if (theme === 'system') return getSystemTheme();
  if (theme === 'high-contrast') return 'light';
  return theme;
}
