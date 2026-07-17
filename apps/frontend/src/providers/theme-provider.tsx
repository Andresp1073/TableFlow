'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Theme } from '@/lib/design-tokens';

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme, attribute: string) {
  const root = document.documentElement;
  const resolved = theme === 'system' ? getSystemTheme() : theme === 'high-contrast' ? 'light' : theme;

  root.classList.remove('light', 'dark', 'high-contrast');

  if (theme === 'high-contrast') {
    root.classList.add('high-contrast');
    root.classList.add(resolved);
  } else {
    root.classList.add(resolved);
  }

  if (attribute === 'class') {
    root.style.colorScheme = resolved;
  }
}

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem('theme', newTheme);
      } catch {
        // Silently handle storage errors
      }
      applyTheme(newTheme, attribute);
      setResolvedTheme(newTheme === 'system' ? getSystemTheme() : newTheme === 'high-contrast' ? 'light' : newTheme);
    },
    [attribute],
  );

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    const initial = stored ?? defaultTheme;
    setThemeState(initial);

    if (disableTransitionOnChange) {
      document.documentElement.classList.add('disable-transitions');
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('disable-transitions');
      });
    }

    applyTheme(initial, attribute);
    setResolvedTheme(initial === 'system' ? getSystemTheme() : initial === 'high-contrast' ? 'light' : initial);

    if (enableSystem) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => {
        if (theme === 'system') {
          applyTheme('system', attribute);
          setResolvedTheme(getSystemTheme());
        }
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme, defaultTheme, enableSystem, attribute, disableTransitionOnChange]);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
