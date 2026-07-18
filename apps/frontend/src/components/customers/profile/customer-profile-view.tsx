'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft, Edit, Archive, RotateCcw, Mail, Phone, Calendar, Star, Tag, FileText, Users } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/customers/shared/status-badge';
import type { CustomerDetail } from '@/lib/customer-types';

interface CustomerProfileViewProps {
  data?: CustomerDetail;
  isLoading: boolean;
  isError: boolean;
  onArchive?: () => void;
  onRestore?: () => void;
}

function DetailRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-0">
      {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="text-sm font-medium mt-0.5">{value ?? <span className="text-muted-foreground italic">Not set</span>}</div>
      </div>
    </div>
  );
}

export function CustomerProfileView({ data, isLoading, isError, onArchive, onRestore }: CustomerProfileViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card><CardContent className="p-6 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</CardContent></Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-medium mb-2">Failed to load customer profile</p>
        <p className="text-sm text-muted-foreground mb-4">The customer could not be found or an error occurred.</p>
        <Link href="/customers"><Button variant="outline">Back to Customers</Button></Link>
      </div>
    );
  }

  const isArchived = data.status === 'archived';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/customers">
            <Button variant="ghost" size="icon-sm" aria-label="Back to customers">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{data.firstName} {data.lastName}</h1>
              <StatusBadge status={data.status} />
              {data.isVip && <Badge variant="warning"><Star className="h-3 w-3 mr-1" />VIP</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">Customer since {new Date(data.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/customers/${data.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
          </Link>
          {isArchived ? (
            <Button variant="outline" size="sm" onClick={onRestore}>
              <RotateCcw className="h-4 w-4 mr-2" /> Restore
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onArchive}>
              <Archive className="h-4 w-4 mr-2" /> Archive
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Full Name" value={`${data.firstName} ${data.lastName}`} icon={<Users className="h-4 w-4" />} />
            <DetailRow label="Email" value={data.email} icon={<Mail className="h-4 w-4" />} />
            <DetailRow label="Phone" value={data.phone} icon={<Phone className="h-4 w-4" />} />
            <DetailRow label="Birth Date" value={data.birthDate ? new Date(data.birthDate).toLocaleDateString() : null} icon={<Calendar className="h-4 w-4" />} />
            <DetailRow label="Preferred Language" value={data.preferredLanguage} icon={<Star className="h-4 w-4" />} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Total Visits" value={data.totalVisits} />
            <DetailRow label="Total Spent" value={data.totalSpent > 0 ? `$${data.totalSpent.toLocaleString('en-US')}` : '$0'} />
            <DetailRow label="Average Ticket" value={data.averageTicket > 0 ? `$${data.averageTicket.toFixed(2)}` : '—'} />
          </CardContent>
        </Card>
      </div>

      {data.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4" /> Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
          </CardContent>
        </Card>
      )}

      {data.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-4 w-4" /> Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
