'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
}

interface RestaurantProviderState {
  current: Restaurant | null;
  restaurants: Restaurant[];
  setCurrent: (restaurant: Restaurant) => void;
  setRestaurants: (restaurants: Restaurant[]) => void;
}

const RestaurantContext = createContext<RestaurantProviderState | undefined>(undefined);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrentState] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurantsState] = useState<Restaurant[]>([]);

  const setCurrent = useCallback((restaurant: Restaurant) => {
    setCurrentState(restaurant);
  }, []);

  const setRestaurants = useCallback((restaurants: Restaurant[]) => {
    setRestaurantsState(restaurants);
  }, []);

  return (
    <RestaurantContext.Provider value={{ current, restaurants, setCurrent, setRestaurants }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) throw new Error('useRestaurant must be used within a RestaurantProvider');
  return context;
}
