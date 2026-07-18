import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SidebarProvider, useSidebar } from '../sidebar-provider';

function wrapper({ children }: { children: React.ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>;
}

describe('SidebarProvider', () => {
  it('provides default collapsed=false', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.collapsed).toBe(false);
  });

  it('provides default mobileOpen=false', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.mobileOpen).toBe(false);
  });

  it('toggleCollapsed flips the value', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    act(() => result.current.toggleCollapsed());
    expect(result.current.collapsed).toBe(true);
    act(() => result.current.toggleCollapsed());
    expect(result.current.collapsed).toBe(false);
  });

  it('toggleMobileOpen flips the value', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    act(() => result.current.toggleMobileOpen());
    expect(result.current.mobileOpen).toBe(true);
  });

  it('setCollapsed sets the value', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    act(() => result.current.setCollapsed(true));
    expect(result.current.collapsed).toBe(true);
  });

  it('setMobileOpen sets the value', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    act(() => result.current.setMobileOpen(true));
    expect(result.current.mobileOpen).toBe(true);
  });

  it('throws without provider', () => {
    expect(() => renderHook(() => useSidebar())).toThrow('useSidebar must be used within a SidebarProvider');
  });
});
