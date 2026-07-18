'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import type { Product, Supplier } from '@/lib/inventory-types';

interface LineItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

interface PurchaseOrderFormProps {
  products: Product[];
  suppliers: Supplier[];
  onSubmit: (data: {
    supplierId: string;
    supplierName: string;
    items: LineItem[];
    notes?: string;
    createdBy: string;
    expectedDeliveryAt?: string;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  createdBy: string;
}

export function PurchaseOrderForm({ products, suppliers, onSubmit, onCancel, isSubmitting, createdBy }: PurchaseOrderFormProps) {
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [expectedDeliveryAt, setExpectedDeliveryAt] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ ingredientId: '', ingredientName: '', quantity: 0, unit: 'Units', unitCost: 0 }]);

  const handleSupplierChange = (id: string) => {
    setSupplierId(id);
    const supplier = suppliers.find((s) => s.id === id);
    setSupplierName(supplier?.name ?? '');
  };

  const addItem = () => {
    setItems([...items, { ingredientId: '', ingredientName: '', quantity: 0, unit: 'Units', unitCost: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const newItem = { ...item, [field]: value };
      if (field === 'ingredientId') {
        const product = products.find((p) => p.id === value);
        if (product) {
          newItem.ingredientName = product.name;
          newItem.unit = product.unit;
          newItem.unitCost = product.costPerUnit;
        }
      }
      return newItem;
    });
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      supplierId,
      supplierName,
      items: items.filter((i) => i.ingredientId && i.quantity > 0),
      notes: notes || undefined,
      createdBy,
      expectedDeliveryAt: expectedDeliveryAt || undefined,
    });
  };

  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Create Purchase Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Supplier</Label>
              <Select value={supplierId} onValueChange={handleSupplierChange}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Expected Delivery</Label>
              <Input type="date" value={expectedDeliveryAt} onChange={(e) => setExpectedDeliveryAt(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" />Add Item</Button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-start border rounded-md p-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Product</Label>
                  <Select value={item.ingredientId} onValueChange={(v) => updateItem(i, 'ingredientId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {products.filter((p) => p.isActive).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-1.5">
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" min="0" step="0.1" value={item.quantity || ''} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} />
                </div>
                <div className="w-24 space-y-1.5">
                  <Label className="text-xs">Unit Cost</Label>
                  <Input type="number" min="0" step="0.01" value={item.unitCost || ''} onChange={(e) => updateItem(i, 'unitCost', Number(e.target.value))} />
                </div>
                <div className="w-24 space-y-1.5">
                  <Label className="text-xs">Total</Label>
                  <div className="h-9 flex items-center text-sm">${(item.quantity * item.unitCost).toFixed(2)}</div>
                </div>
                {items.length > 1 && (
                  <Button type="button" variant="ghost" size="icon-sm" className="mt-5" onClick={() => removeItem(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <div className="text-right text-sm font-medium pt-2">Total: ${totalAmount.toFixed(2)}</div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" loading={isSubmitting} disabled={!supplierId || items.every((i) => !i.ingredientId)}>
              Create Order
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
