'use client';
import { t } from '@/lib/i18n';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown, Plus, Search } from 'lucide-react';
import { useRestaurants } from '@/hooks/use-restaurants';
import type { Restaurant, RestaurantStatus, RestaurantListParams } from '@/lib/restaurant-types';
import { RESTAURANT_STATUS_OPTIONS } from '@/lib/restaurant-types';
import { RestaurantStatusBadge } from '@/components/restaurants/restaurant-status-badge';
import { RestaurantActions } from '@/components/restaurants/restaurant-actions';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

export default function RestaurantsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RestaurantStatus | ''>('');
  const [page, setPage] = useState(1);

  const params: RestaurantListParams = useMemo(() => ({
    page,
    limit: 10,
    search: search || undefined,
    status: (statusFilter as RestaurantStatus) || undefined,
    sortBy: 'name',
    sortOrder: 'asc',
  }), [page, search, statusFilter]);

  const { data, isLoading, isError, error } = useRestaurants(params);

  const restaurants = data?.data ?? [];
  const meta = data?.meta;

  const totalPages = meta?.totalPages ?? 1;

  const columns = useMemo<ColumnDef<Restaurant>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('Name'),
        cell: ({ row }) => (
          <Link
            href={`/restaurants/${row.original.id}`}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'slug',
        header: t('Slug'),
      },
      {
        accessorKey: 'email',
        header: t('Email'),
        cell: ({ getValue }) => getValue<string>() || '—',
      },
      {
        accessorKey: 'status',
        header: t('Status'),
        cell: ({ getValue }) => <RestaurantStatusBadge status={getValue<RestaurantStatus>()} />,
      },
      {
        accessorKey: 'createdAt',
        header: t('Created'),
        cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => <RestaurantActions restaurant={row.original} />,
      },
    ],
    [],
  );

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: restaurants,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  }, [totalPages]);

  return (
    <PageWrapper
      title={t("Restaurants")}
      description={t("Manage all restaurants in your organization")}
      actions={
        <Link href="/restaurants/create">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" />
            New Restaurant
          </Button>
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Search restaurants...")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8"
              aria-label={t("Search restaurants")}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as RestaurantStatus | ''); setPage(1); }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              aria-label={t("Filter by status")}
            >
              <option value="">All Statuses</option>
              {RESTAURANT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                      <p className="text-sm font-medium text-destructive">Error loading restaurants</p>
                      <p className="text-xs mt-1">{(error as Error)?.message || 'An unexpected error occurred'}</p>
                    </div>
                  </td>
                </tr>
              ) : restaurants.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <p className="text-sm">No restaurants found</p>
                      {search || statusFilter ? (
                        <p className="text-xs mt-1">Try adjusting your search or filters</p>
                      ) : (
                        <Link href="/restaurants/create" className="text-xs text-primary hover:underline mt-1">
                          Create your first restaurant
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
                    onClick={() => router.push(`/restaurants/${row.original.id}`)}
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

        {meta && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({meta.total} total)
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || isLoading}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isLoading}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
