'use client';

import { useRestaurant } from '@/providers/restaurant-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export function SettingsRestaurant() {
  const { current, restaurants } = useRestaurant();

  if (!current) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No restaurant selected.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Information</CardTitle>
          <CardDescription>
            Basic information about your restaurant. Edit these details from the restaurant management page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{current.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Slug</p>
              <p className="font-medium">{current.slug}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ID</p>
              <p className="font-medium text-xs font-mono">{current.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Count in Session</p>
              <p className="font-medium">{restaurants.length} restaurant(s)</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
          <div className="pt-4">
            <Button variant="outline" size="sm" asChild>
              <a href="/restaurants" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Manage Restaurants
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
