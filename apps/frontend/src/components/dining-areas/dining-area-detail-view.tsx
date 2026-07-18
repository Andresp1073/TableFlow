import type { DiningArea } from '@/lib/dining-area-types';
import { DiningAreaStatusBadge } from '@/components/dining-areas/dining-area-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Hash, FileText, ListOrdered, Calendar, Clock, ToggleLeft } from 'lucide-react';
import { t } from '@/lib/i18n';

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

export function DiningAreaDetailView({ area }: { area: DiningArea }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{area.name}</h2>
          <p className="text-sm text-muted-foreground">{area.code}</p>
        </div>
        <DiningAreaStatusBadge status={area.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t('Area Information')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={<Hash className="h-4 w-4" />} label={t('Name')} value={area.name} />
            <DetailRow icon={<FileText className="h-4 w-4" />} label={t('Code')} value={area.code} />
            {area.description && (
              <DetailRow icon={<FileText className="h-4 w-4" />} label={t('Description')} value={area.description} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ListOrdered className="h-4 w-4" />
              {t('Configuration')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={<ListOrdered className="h-4 w-4" />} label={t('Display Order')} value={String(area.displayOrder)} />
            <DetailRow icon={<ToggleLeft className="h-4 w-4" />} label={t('Reservable')} value={area.isReservable ? t('Yes') : t('No')} />
            <DetailRow icon={<Building2 className="h-4 w-4" />} label={t('Restaurant ID')} value={area.restaurantId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('Audit Information')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={<Hash className="h-4 w-4" />} label={t('ID')} value={area.id} />
            <DetailRow icon={<Clock className="h-4 w-4" />} label={t('Created')} value={new Date(area.createdAt).toLocaleString()} />
            <DetailRow icon={<Clock className="h-4 w-4" />} label={t('Updated')} value={new Date(area.updatedAt).toLocaleString()} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
