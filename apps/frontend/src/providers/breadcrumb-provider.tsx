'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { BreadcrumbItem } from '@/components/ui/breadcrumb';

interface BreadcrumbProviderState {
  items: BreadcrumbItem[];
  setItems: (items: BreadcrumbItem[]) => void;
  append: (item: BreadcrumbItem) => void;
  clear: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbProviderState | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BreadcrumbItem[]>([]);

  const append = useCallback((item: BreadcrumbItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ items, setItems, append, clear }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  return context;
}
