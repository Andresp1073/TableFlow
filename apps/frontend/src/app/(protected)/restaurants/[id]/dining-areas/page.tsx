'use client';

import { t } from '@/lib/i18n';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown, Plus, Search, ArrowLeft } from 'lucide-react';
import { useDiningAreas } from '@/hooks/use-dining-areas';
import { useRestaurant } from '@/hooks/use-restaurants';
import type { DiningArea, DiningAreaStatus } from '@/lib/dining-area-types';
import { DINING_AREA_STATUS_OPTIONS } from '@/lib/dining-area-types';
import { DiningAreaStatusBadge } from '@/components/dining-areas/dining-area-status-badge';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

export default function DiningAreasPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params?.['id'] as string | undefined;
  const { data: restaurant } = useRestaurant(restaurantId);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const listParams = useMemo(() => ({
    status: (statusFilter as DiningAreaStatus) || undefined,
  }), [statusFilter]);

  const { data: areas, isLoading, isError, error } = useDiningAreas(restaurantId, listParams);

  const filteredAreas = useMemo(() => {
    if (!areas) return [];
    if (!search) return areas;
    const q = search.toLowerCase();
    return areas.filter((a) =>
      a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q),
    );
  }, [areas, search]);

  const columns = useMemo<ColumnDef<DiningArea>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={`/restaurants/${restaurantId}/dining-areas/${row.original.id}`}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'code',
        header: t('Code'),
      },
      {
        accessorKey: 'displayOrder',
        header: t('Order'),
        cell: ({ getValue }) => getValue<number>(),
      },
      {
        accessorKey: 'isReservable',
        header: t('Reservable'),
        cell: ({ getValue }) => (getValue<boolean>() ? t('Yes') : t('No')),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <DiningAreaStatusBadge status={getValue<DiningAreaStatus>()} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
      },
    ],
    [restaurantId],
  );

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: filteredAreas,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <PageWrapper
      title={t('Dining Areas')}
      description={restaurant ? t('Manage dining areas for {name}', { name: restaurant.name }) : t('Manage dining areas')}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/restaurants/${restaurantId}`)}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {t('Back')}
          </Button>
          <Link href={`/restaurants/${restaurantId}/dining-areas/create`}>
            <Button>
              <Plus className="h-4 w-4 mr-1.5" />
              {t('New Area')}
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('Search areas...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
              aria-label={t('Search dining areas')}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              aria-label={t('Filter by status')}
            >
              {DINING_AREA_STATUS_OPTIONS.map((opt) => (
                <option key={String(opt.value)} value={String(opt.value)}>{t(opt.label)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full caption-bottom text-sm">
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
                       <p className="text-sm font-medium text-destructive">{t('Error loading dining areas')}</p>
                      <p className="text-xs mt-1">{(error as Error)?.message || t('An unexpected error occurred')}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredAreas.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                       <p className="text-sm">{t('No dining areas found')}</p>
                      {search || statusFilter ? (
                        <p className="text-xs mt-1">{t('Try adjusting your search or filters')}</p>
                      ) : (
                        <Link
                          href={`/restaurants/${restaurantId}/dining-areas/create`}
                          className="text-xs text-primary hover:underline mt-1"
                        >
                          {t('Create your first dining area')}
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
                    onClick={() => router.push(`/restaurants/${restaurantId}/dining-areas/${row.original.id}`)}
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

        {!isLoading && filteredAreas.length > 0 && (
           <p className="text-sm text-muted-foreground">
            {t('{count} area(s)', { count: filteredAreas.length })}
            {search && ` ${t('matching "{search}"', { search })}`}
          </p>
        )}
      </div>
    </PageWrapper>
  );
}
