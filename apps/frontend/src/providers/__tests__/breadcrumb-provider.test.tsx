import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BreadcrumbProvider, useBreadcrumb } from '../breadcrumb-provider';

function wrapper({ children }: { children: React.ReactNode }) {
  return <BreadcrumbProvider>{children}</BreadcrumbProvider>;
}

describe('BreadcrumbProvider', () => {
  it('starts with empty items', () => {
    const { result } = renderHook(() => useBreadcrumb(), { wrapper });
    expect(result.current.items).toEqual([]);
  });

  it('setItems sets the items', () => {
    const { result } = renderHook(() => useBreadcrumb(), { wrapper });
    const items = [{ label: 'Home', href: '/' }];
    act(() => result.current.setItems(items));
    expect(result.current.items).toEqual(items);
  });

  it('append adds an item', () => {
    const { result } = renderHook(() => useBreadcrumb(), { wrapper });
    act(() => result.current.append({ label: 'Page', href: '/page' }));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]?.label).toBe('Page');
  });

  it('clear removes all items', () => {
    const { result } = renderHook(() => useBreadcrumb(), { wrapper });
    act(() => result.current.setItems([{ label: 'A', href: '/a' }]));
    act(() => result.current.clear());
    expect(result.current.items).toEqual([]);
  });

  it('throws without provider', () => {
    expect(() => renderHook(() => useBreadcrumb())).toThrow('useBreadcrumb must be used within a BreadcrumbProvider');
  });
});
