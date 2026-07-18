'use client';
import { t } from '@/lib/i18n';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CreateOrderInput, CreateOrderItemInput, OrderSource } from '@/lib/sales-types';
import { ORDER_SOURCE_LABELS, formatCurrency } from '@/lib/sales-types';

interface OrderFormProps {
  onSubmit: (data: CreateOrderInput) => void;
  isSubmitting?: boolean;
}

interface FormItem extends CreateOrderItemInput {
  _key: string;
}

const emptyItem = (): FormItem => ({
  _key: crypto.randomUUID(),
  menuItemId: '',
  menuItemName: '',
  quantity: 1,
  unitPrice: 0,
  modifiers: [],
  notes: null,
  stationId: null,
});

export function OrderForm({ onSubmit, isSubmitting }: OrderFormProps) {
  const [source, setSource] = useState<OrderSource>('pos');
  const [tableId, setTableId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState('');
  const [items, setItems] = useState<FormItem[]>([emptyItem()]);

  function addItem() {
    setItems([...items, emptyItem()]);
  }

  function updateItem(key: string, updates: Partial<FormItem>) {
    setItems(items.map((item) => (item._key === key ? { ...item, ...updates } : item)));
  }

  function removeItem(key: string) {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item._key !== key));
  }

  function calculateTotal(): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      source,
      tableId: tableId || null,
      customerName: customerName || null,
      customerCount: customerCount ? parseInt(customerCount, 10) : null,
      items: items
        .filter((item) => item.menuItemName.trim())
        .map(({ _key, ...rest }) => rest),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select value={source} onValueChange={(v) => setSource(v as OrderSource)}>
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ORDER_SOURCE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{t(label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="table">Table</Label>
              <Input id="table" value={tableId} onChange={(e) => setTableId(e.target.value)} placeholder={t("e.g. T-12")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer">Customer Name</Label>
              <Input id="customer" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={t("Walk-in")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guests">Guest Count</Label>
              <Input id="guests" type="number" min={1} value={customerCount} onChange={(e) => setCustomerCount(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, index) => (
            <div key={item._key} className="flex items-end gap-3 p-3 border rounded-lg">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`name-${index}`}>{t('Name')}</Label>
                <Input
                  id={`name-${index}`}
                  value={item.menuItemName}
                  onChange={(e) => updateItem(item._key, { menuItemName: e.target.value })}
                  placeholder={t("Item name")}
                  required
                />
              </div>
              <div className="w-20 space-y-2">
                <Label htmlFor={`qty-${index}`}>Qty</Label>
                <Input
                  id={`qty-${index}`}
                  type="number"
                  min={1}
                  max={100}
                  value={item.quantity}
                  onChange={(e) => updateItem(item._key, { quantity: parseInt(e.target.value, 10) || 1 })}
                />
              </div>
              <div className="w-24 space-y-2">
                <Label htmlFor={`price-${index}`}>Price</Label>
                <Input
                  id={`price-${index}`}
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item._key, { unitPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="w-20 pt-6 text-sm font-medium">
                {formatCurrency(item.quantity * item.unitPrice)}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-destructive"
                onClick={() => removeItem(item._key)}
                disabled={items.length <= 1}
                aria-label={t("Remove item")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          Total: {formatCurrency(calculateTotal())}
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting || items.every((i) => !i.menuItemName.trim())}>
            {isSubmitting ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      </div>
    </form>
  );
}
