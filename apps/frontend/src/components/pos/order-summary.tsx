'use client';
import { t } from '@/lib/i18n';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { OrderItem } from '@/lib/sales-types';
import { formatCurrency } from '@/lib/sales-types';

interface OrderSummaryProps {
  items: OrderItem[];
  onRemoveItem: (itemId: string) => void;
  onClear: () => void;
}

export function OrderSummary({ items, onRemoveItem, onClear }: OrderSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + tax;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('Current Order')}</CardTitle>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear} className="text-destructive h-auto px-2">
              {t('Clear')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="h-[300px] overflow-y-auto px-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('No items added yet')}
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.menuItemName}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatCurrency(item.lineTotal)}</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-6 w-6 text-destructive"
                      onClick={() => onRemoveItem(item.id)}
                      aria-label={t('Remove {itemName}', { itemName: item.menuItemName })}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-1 border-t pt-3">
        <div className="flex justify-between w-full text-sm text-muted-foreground">
          <span>{t('Subtotal')}</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between w-full text-sm text-muted-foreground">
          <span>{t('Tax (8%)')}</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between w-full font-semibold text-base pt-1 border-t mt-1">
          <span>{t('Total')}</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
