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
import { ChevronUp, ChevronDown, ChevronsUpDown, Plus, Search } from 'lucide-react';
import { useTables } from '@/hooks/use-tables';
import { useRestaurant } from '@/providers/restaurant-provider';
import type { RestaurantTable, TableStatus } from '@/lib/table-types';
import { TABLE_STATUS_OPTIONS } from '@/lib/table-types';
import { TableStatusBadge } from '@/components/tables/table-status-badge';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

export default function TablesPage() {
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? '';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const listParams = useMemo(() => ({
    status: (statusFilter as TableStatus) || undefined,
  }), [statusFilter]);

  const { data: tables, isLoading, isError, error } = useTables(restaurantId, listParams);

  const filteredTables = useMemo(() => {
    if (!tables) return [];
    if (!search) return tables;
    const q = search.toLowerCase();
    return tables.filter((t) =>
      t.tableNumber.toLowerCase().includes(q) || (t.name ?? '').toLowerCase().includes(q),
    );
  }, [tables, search]);

  const columns = useMemo<ColumnDef<RestaurantTable>[]>(
    () => [
      {
        accessorKey: 'tableNumber',
        header: t('Table'),
        cell: ({ row }) => (
          <Link
            href={`/tables/${row.original.id}`}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {row.original.tableNumber}
          </Link>
        ),
      },
      {
        accessorKey: 'name',
        header: t('Name'),
        cell: ({ getValue }) => (getValue<string>() ? getValue<string>() : '—'),
      },
      {
        accessorKey: 'minimumCapacity',
        header: t('Capacity'),
        cell: ({ row }) => `${row.original.minimumCapacity} – ${row.original.maximumCapacity}`,
      },
      {
        accessorKey: 'currentCapacity',
        header: t('Occupied'),
        cell: ({ getValue }) => `${getValue<number>()}`,
      },
      {
        accessorKey: 'shape',
        header: t('Shape'),
      },
      {
        accessorKey: 'status',
        header: t('Status'),
        cell: ({ getValue }) => <TableStatusBadge status={getValue<TableStatus>()} />,
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
    data: filteredTables,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <PageWrapper
      title={t('Tables')}
      description={t('Manage table configurations, layouts, and availability')}
      actions={
        <div className="flex items-center gap-2">
          {restaurantId && (
            <Link href="/tables/create">
              <Button>
                <Plus className="h-4 w-4 mr-1.5" />
                {t('New Table')}
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
              placeholder={t('Search tables...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
              aria-label={t('Search tables')}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              aria-label={t('Filter by status')}
            >
              {TABLE_STATUS_OPTIONS.map((opt) => (
                <option key={String(opt.value)} value={String(opt.value)}>{t(opt.label)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full caption-bottom text-sm" aria-label={t('Tables list')}>
            <caption className="sr-only">{t('List of tables with search and filter options')}</caption>
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
                      <p className="text-sm font-medium text-destructive">{t('Error loading tables')}</p>
                      <p className="text-xs mt-1">{(error as Error)?.message || t('An unexpected error occurred')}</p>
                    </div>
                  </td>
                </tr>
              ) : !restaurantId ? (
                <tr>
                  <td colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <p className="text-sm">{t('Select a restaurant to manage tables')}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTables.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <p className="text-sm">{t('No tables found')}</p>
                      {search || statusFilter ? (
                        <p className="text-xs mt-1">{t('Try adjusting your search or filters')}</p>
                      ) : (
                        <Link
                          href="/tables/create"
                          className="text-xs text-primary hover:underline mt-1"
                        >
                          {t('Create your first table')}
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
                    onClick={() => router.push(`/tables/${row.original.id}`)}
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

        {!isLoading && filteredTables.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {filteredTables.length} {filteredTables.length === 1 ? t('table') : t('tables')}
            {search && t('matching "{search}"', { search })}
          </p>
        )}
      </div>
    </PageWrapper>
  );
}
