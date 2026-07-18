'use client';
import { t } from '@/lib/i18n';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { CreateCustomerInput } from '@/lib/customer-types';

interface CustomerFormProps {
  initialData?: Partial<CreateCustomerInput>;
  onSubmit: (data: CreateCustomerInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  mode: 'create' | 'edit';
}

export function CustomerForm({ initialData, onSubmit, onCancel, isSubmitting, error, mode }: CustomerFormProps) {
  const [firstName, setFirstName] = useState(initialData?.firstName ?? '');
  const [lastName, setLastName] = useState(initialData?.lastName ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [birthDate, setBirthDate] = useState(initialData?.birthDate ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [marketingConsent, setMarketingConsent] = useState(initialData?.marketingConsent ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      birthDate: birthDate || null,
      notes: notes.trim() || null,
      marketingConsent,
    });
  };

  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/customers">
          <Button variant="ghost" size="icon-sm" aria-label={t("Back")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{mode === 'create' ? 'Create Customer' : 'Edit Customer'}</h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'create' ? 'Add a new customer to your restaurant' : 'Update customer information'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder={t("John")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder={t("Doe")} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("john@example.com")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("+1 (555) 123-4567")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("Any special notes about this customer...")}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch id="marketing" checked={marketingConsent} onCheckedChange={setMarketingConsent} />
              <Label htmlFor="marketing">Customer consented to marketing communications</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" loading={isSubmitting} disabled={!isValid}>
            {mode === 'create' ? 'Create Customer' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
