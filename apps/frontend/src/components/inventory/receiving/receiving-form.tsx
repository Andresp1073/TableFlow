'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Package } from 'lucide-react';
import type { Product, ReceiveStockItem } from '@/lib/inventory-types';

interface ReceivingItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  costAtReceipt: number;
  batchCode: string;
  location: string;
  expiresAt: string;
}

interface ReceivingFormProps {
  products: Product[];
  initialOrderId?: string;
  onSubmit: (items: ReceiveStockItem[], notes?: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ReceivingForm({ products, initialOrderId, onSubmit, onCancel, isSubmitting }: ReceivingFormProps) {
  const [items, setItems] = useState<ReceivingItem[]>([{ ingredientId: '', ingredientName: '', quantity: 0, unit: 'Units', costAtReceipt: 0, batchCode: '', location: '', expiresAt: '' }]);
  const [notes, setNotes] = useState('');

  const addItem = () => {
    setItems([...items, { ingredientId: '', ingredientName: '', quantity: 0, unit: 'Units', costAtReceipt: 0, batchCode: '', location: '', expiresAt: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ReceivingItem, value: string | number) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const newItem = { ...item, [field]: value };
      if (field === 'ingredientId') {
        const product = products.find((p) => p.id === value);
        if (product) {
          newItem.ingredientName = product.name;
          newItem.unit = product.unit;
        }
      }
      return newItem;
    });
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const receiveItems: ReceiveStockItem[] = items
      .filter((i) => i.ingredientId && i.quantity > 0)
      .map((i) => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
        unit: i.unit as ReceiveStockItem['unit'],
        costAtReceipt: i.costAtReceipt || undefined,
        batchCode: i.batchCode || undefined,
        location: i.location || undefined,
        expiresAt: i.expiresAt || undefined,
        purchaseOrderId: initialOrderId,
      }));
    onSubmit(receiveItems, notes || undefined);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Receive Stock
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {initialOrderId && (
            <div className="text-sm text-muted-foreground bg-muted rounded-md p-3">
              Receiving for order: <span className="font-mono">{initialOrderId.slice(-8)}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Receiving notes (optional)" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Items to Receive</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" />Add Item</Button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="border rounded-md p-3 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Product</Label>
                    <Select value={item.ingredientId} onValueChange={(v) => updateItem(i, 'ingredientId', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {products.filter((p) => p.isActive).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quantity *</Label>
                    <Input type="number" min="0" step="0.1" value={item.quantity || ''} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unit Cost</Label>
                    <Input type="number" min="0" step="0.01" value={item.costAtReceipt || ''} onChange={(e) => updateItem(i, 'costAtReceipt', Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Batch Code</Label>
                    <Input value={item.batchCode} onChange={(e) => updateItem(i, 'batchCode', e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Location</Label>
                    <Input value={item.location} onChange={(e) => updateItem(i, 'location', e.target.value)} placeholder="e.g. Fridge A" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Expiry Date</Label>
                    <Input type="date" value={item.expiresAt} onChange={(e) => updateItem(i, 'expiresAt', e.target.value)} />
                  </div>
                  <div className="flex items-end">
                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeItem(i)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" loading={isSubmitting} disabled={items.every((i) => !i.ingredientId)}>
              Receive Stock
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
