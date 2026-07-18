'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORY_OPTIONS, UNIT_OPTIONS } from '@/lib/inventory-types';
import type { CreateProductInput } from '@/lib/inventory-types';

interface ProductFormProps {
  initialData?: Partial<CreateProductInput>;
  onSubmit: (data: CreateProductInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProductForm({ initialData, onSubmit, onCancel, isSubmitting }: ProductFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [category, setCategory] = useState(initialData?.category ?? 'RawMaterial');
  const [unit, setUnit] = useState(initialData?.unit ?? 'Units');
  const [costPerUnit, setCostPerUnit] = useState(initialData?.costPerUnit ?? 0);
  const [sku, setSku] = useState(initialData?.sku ?? '');
  const [perishable, setPerishable] = useState(initialData?.perishable ?? false);
  const [shelfLifeDays, setShelfLifeDays] = useState(initialData?.shelfLifeDays ?? undefined);
  const [storageInstructions, setStorageInstructions] = useState(initialData?.storageInstructions ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      category: category as CreateProductInput['category'],
      unit: unit as CreateProductInput['unit'],
      costPerUnit,
      sku: sku || undefined,
      perishable,
      shelfLifeDays: shelfLifeDays || undefined,
      storageInstructions: storageInstructions || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? 'Edit Product' : 'Create Product'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Product name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Optional SKU" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unit of Measure</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cost">Cost per Unit</Label>
              <Input id="cost" type="number" min="0" step="0.01" value={costPerUnit} onChange={(e) => setCostPerUnit(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shelfLife">Shelf Life (days)</Label>
              <Input id="shelfLife" type="number" min="1" value={shelfLifeDays ?? ''} onChange={(e) => setShelfLifeDays(e.target.value ? Number(e.target.value) : undefined)} placeholder="Optional" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="perishable" checked={perishable} onCheckedChange={setPerishable} />
            <Label htmlFor="perishable">Perishable item</Label>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="storage">Storage Instructions</Label>
            <Textarea id="storage" value={storageInstructions} onChange={(e) => setStorageInstructions(e.target.value)} placeholder="Optional storage notes" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{initialData ? 'Update' : 'Create'} Product</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
