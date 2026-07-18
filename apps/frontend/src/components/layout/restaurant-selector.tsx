'use client';

import { Building2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRestaurant } from '@/providers/restaurant-provider';

const MOCK_RESTAURANTS = [
  { id: '1', name: 'Main Restaurant', slug: 'main' },
  { id: '2', name: 'Downtown Bistro', slug: 'downtown' },
  { id: '3', name: 'Uptown Grill', slug: 'uptown' },
];

export function RestaurantSelector() {
  const { current, setCurrent } = useRestaurant();

  const handleChange = (slug: string) => {
    const restaurant = MOCK_RESTAURANTS.find((r) => r.slug === slug);
    if (restaurant) setCurrent(restaurant);
  };

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
      <Select value={current?.slug ?? ''} onValueChange={handleChange}>
        <SelectTrigger className="h-8 w-44 border-none bg-transparent px-0 text-sm font-medium hover:text-foreground focus:ring-0">
          <SelectValue placeholder="Select restaurant" />
        </SelectTrigger>
        <SelectContent align="start">
          {MOCK_RESTAURANTS.map((r) => (
            <SelectItem key={r.id} value={r.slug}>
              {r.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
