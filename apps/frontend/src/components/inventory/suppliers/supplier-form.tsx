'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CreateSupplierInput } from '@/lib/inventory-types';

interface SupplierFormProps {
  onSubmit: (data: CreateSupplierInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function SupplierForm({ onSubmit, onCancel, isSubmitting }: SupplierFormProps) {
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState(3);
  const [minimumOrderAmount, setMinimumOrderAmount] = useState(0);
  const [preferred, setPreferred] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      contactName: contactName || undefined,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      leadTimeDays,
      minimumOrderAmount,
      preferred,
      paymentTerms: paymentTerms || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader><CardTitle>Create Supplier</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Supplier name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact">Contact Person</Label>
              <Input id="contact" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leadTime">Lead Time (days)</Label>
              <Input id="leadTime" type="number" min="0" value={leadTimeDays} onChange={(e) => setLeadTimeDays(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="minOrder">Min Order Amount ($)</Label>
              <Input id="minOrder" type="number" min="0" step="0.01" value={minimumOrderAmount} onChange={(e) => setMinimumOrderAmount(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Input id="paymentTerms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. Net 30" />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="preferred" checked={preferred} onCheckedChange={setPreferred} />
            <Label htmlFor="preferred">Preferred supplier</Label>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create Supplier</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
