'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowLeft, Mail, Phone, MapPin, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';
import type { SupplierDetail } from '@/lib/inventory-types';
import { formatCurrency } from '@/lib/inventory-types';

interface SupplierDetailViewProps {
  data?: SupplierDetail;
  isLoading: boolean;
  isError: boolean;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 text-sm border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function SupplierDetailView({ data, isLoading, isError }: SupplierDetailViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="p-6 space-y-3"><Skeleton className="h-4 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-sm text-muted-foreground">Failed to load supplier</p>
        <Button variant="outline" size="sm" className="mt-4" asChild><Link href="/inventory/suppliers">Go Back</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" asChild><Link href="/inventory/suppliers"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{data.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={data.status === 'Active' ? 'success' : data.status === 'Inactive' ? 'secondary' : 'danger'}>{data.status}</Badge>
            {data.preferred && <Badge variant="warning">Preferred</Badge>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
          <CardContent>
            <DetailRow label="Contact Name" value={data.contactName ?? '—'} />
            <DetailRow label="Email" value={
              data.email ? <a href={`mailto:${data.email}`} className="hover:underline flex items-center gap-1"><Mail className="h-3 w-3" />{data.email}</a> : '—'
            } />
            <DetailRow label="Phone" value={
              data.phone ? <a href={`tel:${data.phone}`} className="hover:underline flex items-center gap-1"><Phone className="h-3 w-3" />{data.phone}</a> : '—'
            } />
            <DetailRow label="Address" value={
              data.address ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{data.address}</span> : '—'
            } />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Business Details</CardTitle></CardHeader>
          <CardContent>
            <DetailRow label="Lead Time" value={<span className="flex items-center gap-1"><Clock className="h-3 w-3" />{data.leadTimeDays} days</span>} />
            <DetailRow label="Min Order" value={<span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatCurrency(data.minimumOrderAmount)}</span>} />
            <DetailRow label="Payment Terms" value={data.paymentTerms ?? '—'} />
            <DetailRow label="Notes" value={data.notes ?? '—'} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Products ({data.products.length})</CardTitle></CardHeader>
        <CardContent>
          {data.products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products linked to this supplier</p>
          ) : (
            <div className="space-y-1">
              {data.products.map((p) => (
                <div key={p.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <Link href={`/inventory/products/${p.id}`} className="hover:underline">{p.name}</Link>
                  <span className="text-muted-foreground">{formatCurrency(p.costPerUnit)} / {p.unit}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
