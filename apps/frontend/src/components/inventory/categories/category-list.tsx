'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Layers } from 'lucide-react';
import type { Category } from '@/lib/inventory-types';

interface CategoryListProps {
  data?: Category[];
  isLoading: boolean;
  isError: boolean;
}

export function CategoryList({ data, isLoading, isError }: CategoryListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-4 w-16" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-sm text-muted-foreground">Failed to load categories</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Layers className="h-8 w-8 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">No categories found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((cat) => (
        <Card key={cat.id} className="hover:bg-muted/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{cat.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{cat.productCount} products</Badge>
              <Badge variant="success">{cat.activeCount} active</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
