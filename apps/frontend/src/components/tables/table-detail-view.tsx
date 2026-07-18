import type { RestaurantTable } from '@/lib/table-types';
import {
  TABLE_STATUS_LABELS,
  TABLE_STATUS_COLORS,
  TABLE_SHAPE_OPTIONS,
} from '@/lib/table-types';
import { TableStatusBadge } from '@/components/tables/table-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';
import {
  Hash,
  FileText,
  Users,
  Maximize2,
  MapPin,
  RotateCw,
  ToggleLeft,
  Calendar,
  Clock,
  Building2,
  Table2,
} from 'lucide-react';

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

export function TableDetailView({ table }: { table: RestaurantTable }) {
  const shapeLabel = TABLE_SHAPE_OPTIONS.find((o) => o.value === table.shape)?.label ?? table.shape;
  const capacityLabel = table.minimumCapacity === table.maximumCapacity
    ? String(table.minimumCapacity)
    : `${table.minimumCapacity} – ${table.maximumCapacity}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            Table {table.tableNumber}
            {table.name && <span className="text-muted-foreground ml-2">({table.name})</span>}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="h-2 w-2 rounded-full inline-block"
              style={{ backgroundColor: TABLE_STATUS_COLORS[table.status] }}
              aria-hidden="true"
            />
            <span className="text-sm text-muted-foreground">
              {TABLE_STATUS_LABELS[table.status]}
            </span>
          </div>
        </div>
        <TableStatusBadge status={table.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              {t('Table Information')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={<Hash className="h-4 w-4" />} label={t('Table Number')} value={table.tableNumber} />
            <DetailRow icon={<Building2 className="h-4 w-4" />} label={t('Name')} value={table.name} />
            <DetailRow icon={<FileText className="h-4 w-4" />} label={t('Description')} value={table.description} />
            {table.shape && <DetailRow icon={<Maximize2 className="h-4 w-4" />} label={t('Shape')} value={shapeLabel} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('Capacity & Status')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={<Users className="h-4 w-4" />} label={t('Capacity')} value={capacityLabel} />
            <DetailRow icon={<Users className="h-4 w-4" />} label={t('Current Occupancy')} value={String(table.currentCapacity)} />
            <DetailRow
              icon={<ToggleLeft className="h-4 w-4" />}
              label={t('Reservable')}
              value={table.isReservable ? t('Yes') : t('No')}
            />
            <DetailRow
              icon={<ToggleLeft className="h-4 w-4" />}
              label={t('Accessible')}
              value={table.isAccessible ? t('Yes') : t('No')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t('Position & Dimensions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow
              icon={<MapPin className="h-4 w-4" />}
              label={t('Position')}
              value={
                table.positionX != null && table.positionY != null
                  ? `(${table.positionX}, ${table.positionY})`
                  : t('Not positioned')
              }
            />
            <DetailRow
              icon={<Maximize2 className="h-4 w-4" />}
              label={t('Dimensions')}
              value={`${table.width} × ${table.height}`}
            />
            {table.rotation != null && (
              <DetailRow icon={<RotateCw className="h-4 w-4" />}               label={t('Rotation')} value={`${table.rotation}°`} />
            )}
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
            <DetailRow icon={<Hash className="h-4 w-4" />} label={t('ID')} value={table.id} />
            <DetailRow icon={<Building2 className="h-4 w-4" />} label={t('Restaurant ID')} value={table.restaurantId} />
            <DetailRow icon={<Clock className="h-4 w-4" />} label={t('Created')} value={new Date(table.createdAt).toLocaleString()} />
            <DetailRow icon={<Clock className="h-4 w-4" />} label={t('Updated')} value={new Date(table.updatedAt).toLocaleString()} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
