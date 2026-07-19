'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown, Plus, Search, CalendarDays } from 'lucide-react';
import { useReservations } from '@/hooks/use-reservations';
import { useRestaurant } from '@/providers/restaurant-provider';
import type { ReservationSummary, ReservationStatus } from '@/lib/reservation-types';
import { RESERVATION_STATUS_OPTIONS } from '@/lib/reservation-types';
import { ReservationStatusBadge } from '@/components/reservations/reservation-status-badge';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/cn';

export default function ReservationsPage() {
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? '';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const listParams = useMemo(() => ({
    status: (statusFilter as ReservationStatus) || undefined,
  }), [statusFilter]);

  const { data: reservations, isLoading, isError, error } = useReservations(restaurantId, listParams);

  const filteredReservations = useMemo(() => {
    if (!reservations) return [];
    if (!search) return reservations;
    const q = search.toLowerCase();
    return reservations.filter((r) =>
      r.reservationNumber.toLowerCase().includes(q),
    );
  }, [reservations, search]);

  const columns = useMemo<ColumnDef<ReservationSummary>[]>(
    () => [
      {
        accessorKey: 'reservationNumber',
        header: t('Reservation'),
        cell: ({ row }) => (
          <Link
            href={`/reservations/${row.original.id}`}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {row.original.reservationNumber}
          </Link>
        ),
      },
      {
        accessorKey: 'date',
        header: t('Date'),
        cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
      },
      {
        accessorKey: 'startTime',
        header: t('Time'),
        cell: ({ row }) => {
          const start = new Date(row.original.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          const end = new Date(row.original.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          return `${start} - ${end}`;
        },
      },
      {
        accessorKey: 'partySize',
        header: t('Party'),
        cell: ({ getValue }) => `${getValue<number>()}`,
      },
      {
        accessorKey: 'source',
        header: t('Source'),
      },
      {
        accessorKey: 'status',
        header: t('Status'),
        cell: ({ getValue }) => <ReservationStatusBadge status={getValue<ReservationStatus>()} />,
      },
      {
        accessorKey: 'createdAt',
        header: t('Created'),
        cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
      },
    ],
    [],
  );

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: filteredReservations,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <PageWrapper
      title={t('Reservations')}
      description={t('View and manage all reservations')}
      actions={
        <div className="flex items-center gap-2">
          {restaurantId && (
            <Link href={`/restaurants/${restaurantId}/reservations/calendar`}>
              <Button variant="outline" size="sm">
                <CalendarDays className="h-4 w-4 mr-1.5" />
                {t('Calendar')}
              </Button>
            </Link>
          )}
          {restaurantId && (
            <Link href="/reservations/create">
              <Button>
                <Plus className="h-4 w-4 mr-1.5" />
                {t('New Reservation')}
              </Button>
            </Link>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('Search reservations...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
              aria-label={t('Search reservations')}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              aria-label={t('Filter by status')}
            >
              {RESERVATION_STATUS_OPTIONS.map((opt) => (
                <option key={String(opt.value)} value={String(opt.value)}>{t(opt.label)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full caption-bottom text-sm" aria-label={t('Reservations list')}>
            <caption className="sr-only">{t('List of reservations with search and filter options')}</caption>
            <thead className="border-b bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        'h-10 px-3 text-left align-middle font-medium text-muted-foreground',
                        header.column.getCanSort() && 'cursor-pointer select-none hover:text-foreground',
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                      aria-sort={
                        header.column.getIsSorted() === 'asc'
                          ? 'ascending'
                          : header.column.getIsSorted() === 'desc'
                            ? 'descending'
                            : 'none'
                      }
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="inline-flex">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronsUpDown className="h-3.5 w-3.5 opacity-30" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="border-b">
                    {columns.map((_, colIndex) => (
                      <td key={colIndex} className="p-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <p className="text-sm font-medium text-destructive">{t('Error loading reservations')}</p>
                      <p className="text-xs mt-1">{(error as Error)?.message || t('An unexpected error occurred')}</p>
                    </div>
                  </td>
                </tr>
              ) : !restaurantId ? (
                <tr>
                  <td colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <p className="text-sm">{t('Select a restaurant to manage reservations')}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <p className="text-sm">{t('No reservations found')}</p>
                      {search || statusFilter ? (
                        <p className="text-xs mt-1">{t('Try adjusting your search or filters')}</p>
                      ) : (
                        <Link
                          href="/reservations/create"
                          className="text-xs text-primary hover:underline mt-1"
                        >
                          {t('Create your first reservation')}
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b transition-colors hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/reservations/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredReservations.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {t('{count} reservations', { count: filteredReservations.length })}
            {search && t('matching "{query}"', { query: search })}
          </p>
        )}
      </div>
    </PageWrapper>
  );
}
