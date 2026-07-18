import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RestaurantProvider, useRestaurant } from '../restaurant-provider';

function wrapper({ children }: { children: React.ReactNode }) {
  return <RestaurantProvider>{children}</RestaurantProvider>;
}

describe('RestaurantProvider', () => {
  it('starts with null current', () => {
    const { result } = renderHook(() => useRestaurant(), { wrapper });
    expect(result.current.current).toBeNull();
  });

  it('starts with empty restaurants', () => {
    const { result } = renderHook(() => useRestaurant(), { wrapper });
    expect(result.current.restaurants).toEqual([]);
  });

  it('setCurrent sets the current restaurant', () => {
    const { result } = renderHook(() => useRestaurant(), { wrapper });
    const restaurant = { id: '1', name: 'Test', slug: 'test' };
    act(() => result.current.setCurrent(restaurant));
    expect(result.current.current).toEqual(restaurant);
  });

  it('setRestaurants sets the list', () => {
    const { result } = renderHook(() => useRestaurant(), { wrapper });
    const list = [{ id: '1', name: 'A', slug: 'a' }, { id: '2', name: 'B', slug: 'b' }];
    act(() => result.current.setRestaurants(list));
    expect(result.current.restaurants).toHaveLength(2);
  });

  it('throws without provider', () => {
    expect(() => renderHook(() => useRestaurant())).toThrow('useRestaurant must be used within a RestaurantProvider');
  });
});
