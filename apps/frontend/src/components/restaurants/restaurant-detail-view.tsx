import type { Restaurant } from '@/lib/restaurant-types';
import { RestaurantStatusBadge } from '@/components/restaurants/restaurant-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Mail, Phone, MapPin, Clock, DollarSign, Languages, FileText, Tag, Building2 } from 'lucide-react';

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

export function RestaurantDetailView({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{restaurant.name}</h2>
          <p className="text-sm text-muted-foreground">{restaurant.slug}</p>
        </div>
        <RestaurantStatusBadge status={restaurant.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={<FileText className="h-4 w-4" />} label="Legal Name" value={restaurant.legalName} />
            <DetailRow icon={<Tag className="h-4 w-4" />} label="Tax ID" value={restaurant.taxId} />
            <DetailRow icon={<Globe className="h-4 w-4" />} label="Website" value={restaurant.website} />
            {restaurant.logoUrl && (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-muted-foreground shrink-0">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Logo</p>
                  <img src={restaurant.logoUrl} alt={`${restaurant.name} logo`} className="mt-1 h-12 w-12 rounded object-cover" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location & Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={restaurant.email} />
            <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={restaurant.phone} />
            <DetailRow icon={<MapPin className="h-4 w-4" />} label="Address" value={restaurant.address} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Regional Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={<Clock className="h-4 w-4" />} label="Timezone" value={restaurant.timezone} />
            <DetailRow icon={<DollarSign className="h-4 w-4" />} label="Currency" value={restaurant.currency} />
            <DetailRow icon={<Languages className="h-4 w-4" />} label="Language" value={restaurant.language} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              System Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={<Tag className="h-4 w-4" />} label="ID" value={restaurant.id} />
            <DetailRow icon={<Clock className="h-4 w-4" />} label="Created" value={new Date(restaurant.createdAt).toLocaleString()} />
            <DetailRow icon={<Clock className="h-4 w-4" />} label="Updated" value={new Date(restaurant.updatedAt).toLocaleString()} />
            {restaurant.deletedAt && (
              <DetailRow icon={<Clock className="h-4 w-4" />} label="Archived" value={new Date(restaurant.deletedAt).toLocaleString()} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
