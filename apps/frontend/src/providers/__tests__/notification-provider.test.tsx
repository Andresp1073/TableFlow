import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { NotificationProvider, useNotifications } from '../notification-provider';

function wrapper({ children }: { children: React.ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>;
}

describe('NotificationProvider', () => {
  it('starts with empty notifications', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('add adds a notification', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    act(() =>
      result.current.add({
        id: '1',
        title: 'Test',
        read: false,
        createdAt: new Date(),
      }),
    );
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.unreadCount).toBe(1);
  });

  it('markAsRead marks a notification as read', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    act(() =>
      result.current.add({
        id: '1',
        title: 'Test',
        read: false,
        createdAt: new Date(),
      }),
    );
    act(() => result.current.markAsRead('1'));
    expect(result.current.notifications[0]?.read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('markAllAsRead marks all as read', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    act(() => {
      result.current.add({ id: '1', title: 'A', read: false, createdAt: new Date() });
      result.current.add({ id: '2', title: 'B', read: false, createdAt: new Date() });
    });
    act(() => result.current.markAllAsRead());
    expect(result.current.unreadCount).toBe(0);
  });

  it('clear removes all notifications', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    act(() =>
      result.current.add({ id: '1', title: 'Test', read: false, createdAt: new Date() }),
    );
    act(() => result.current.clear());
    expect(result.current.notifications).toEqual([]);
  });

  it('throws without provider', () => {
    expect(() => renderHook(() => useNotifications())).toThrow(
      'useNotifications must be used within a NotificationProvider',
    );
  });
});
