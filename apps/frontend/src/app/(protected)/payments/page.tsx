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
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, DollarSign, CreditCard, RefreshCw, XCircle } from 'lucide-react';
import { usePaymentDashboard, usePayments } from '@/hooks/use-payments';
import { useRestaurant } from '@/providers/restaurant-provider';
import type { PaymentTransaction, PaymentTransactionStatus } from '@/lib/payment-types';
import { TRANSACTION_STATUS_OPTIONS, METHOD_TYPE_OPTIONS, formatCurrency } from '@/lib/payment-types';
import { t } from '@/lib/i18n';
import { PaymentStatusBadge } from '@/components/payments/payment-status-badge';
import { PaymentMethodBadge } from '@/components/payments/payment-method-badge';
import { PaymentDashboardSkeleton } from '@/components/payments/payment-detail-skeleton';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';

export default function PaymentsPage() {
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? '';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const listParams = useMemo(() => ({
    status: (statusFilter as PaymentTransactionStatus) || undefined,
    methodType: methodFilter || undefined,
    search: search || undefined,
    page,
    limit: 20,
  }), [statusFilter, methodFilter, search, page]);

  const { data: dashboard, isLoading: dashboardLoading } = usePaymentDashboard(restaurantId);
  const { data: listData, isLoading: listLoading, isError, error } = usePayments(restaurantId, listParams);

  const columns = useMemo<ColumnDef<PaymentTransaction>[]>(
    () => [
      {
        accessorKey: 'id',
        header: t('Transaction ID'),
        cell: ({ row }) => (
          <Link
            href={`/payments/${row.original.id}`}
            className="font-medium text-foreground hover:text-primary transition-colors font-mono text-xs"
          >
            {row.original.id.slice(0, 8)}...
          </Link>
        ),
      },
      {
        accessorKey: 'amount',
        header: t('Amount'),
        cell: ({ getValue }) => formatCurrency(getValue<number>()),
      },
      {
        accessorKey: 'methodType',
        header: t('Method'),
        cell: ({ getValue }) => <PaymentMethodBadge method={getValue<string>()} />,
      },
      {
        accessorKey: 'providerId',
        header: t('Provider'),
      },
      {
        accessorKey: 'status',
        header: t('Status'),
        cell: ({ getValue }) => <PaymentStatusBadge status={getValue<PaymentTransactionStatus>()} />,
      },
      {
        accessorKey: 'createdAt',
        header: t('Date'),
        cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
      },
    ],
    [],
  );

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: listData?.transactions ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const revenueMethods = useMemo(() => {
    if (!dashboard?.revenueByMethod) return [];
    return Object.entries(dashboard.revenueByMethod)
      .sort(([, a], [, b]) => b - a)
      .map(([method, amount]) => ({ method, amount }));
  }, [dashboard?.revenueByMethod]);

  return (
    <PageWrapper
      title={t('Payments')}
      description={t('Manage payment processing, transactions, and refunds')}
    >
      <div className="space-y-6">
        {/* Dashboard Stats */}
        {dashboardLoading ? (
          <PaymentDashboardSkeleton />
        ) : dashboard ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t("Today's Revenue")}</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(dashboard.todayRevenue)}</p>
                  <p className="text-xs text-muted-foreground">{t('{count} transactions today', { count: dashboard.todayCount })}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t('Pending')}</CardTitle>
                  <RefreshCw className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-yellow-500">{dashboard.pending}</p>
                  <p className="text-xs text-muted-foreground">{t('Awaiting completion')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t('Completed')}</CardTitle>
                  <CreditCard className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">{dashboard.completed}</p>
                  <p className="text-xs text-muted-foreground">{t('Successfully processed')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t('Issues')}</CardTitle>
                  <XCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-destructive">{dashboard.failed + dashboard.refunded}</p>
                  <p className="text-xs text-muted-foreground">{t('{failed} failed, {refunded} refunded', { failed: dashboard.failed, refunded: dashboard.refunded })}</p>
                </CardContent>
              </Card>
            </div>

            {/* Revenue by Method */}
            {revenueMethods.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('Revenue by Payment Method')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {revenueMethods.map(({ method, amount }) => {
                      const pct = dashboard.todayRevenue > 0 ? (amount / dashboard.todayRevenue) * 100 : 0;
                      return (
                        <div key={method} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="capitalize">{method.replace(/_/g, ' ')}</span>
                            <span className="font-medium">{formatCurrency(amount)}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}

        {/* Transactions List */}
        <div>
          <h3 className="text-lg font-semibold mb-4">{t('Transaction History')}</h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('Search transactions...')}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-8"
                  aria-label={t('Search transactions')}
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  aria-label={t('Filter by status')}
                >
                  {TRANSACTION_STATUS_OPTIONS.map((opt) => (
                    <option key={String(opt.value)} value={String(opt.value)}>{t(opt.label)}</option>
                  ))}
                </select>
                <select
                  value={methodFilter}
                  onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  aria-label={t('Filter by method')}
                >
                  {METHOD_TYPE_OPTIONS.map((opt) => (
                    <option key={String(opt.value)} value={String(opt.value)}>{t(opt.label)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full caption-bottom text-sm" aria-label={t('Payments list')}>
                <caption className="sr-only">{t('List of payment transactions with search and filter options')}</caption>
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
                  {listLoading ? (
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
                          <p className="text-sm font-medium text-destructive">{t('Error loading payments')}</p>
                          <p className="text-xs mt-1">{(error as Error)?.message || t('An unexpected error occurred')}</p>
                        </div>
                      </td>
                    </tr>
                  ) : !restaurantId ? (
                    <tr>
                      <td colSpan={columns.length} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <p className="text-sm">{t('Select a restaurant to view payments')}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (listData?.transactions?.length ?? 0) === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <p className="text-sm">{t('No transactions found')}</p>
                          {search || statusFilter || methodFilter ? (
                            <p className="text-xs mt-1">{t('Try adjusting your search or filters')}</p>
                          ) : (
                            <p className="text-xs mt-1">{t('Payments appear here after processing orders through POS checkout')}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b transition-colors hover:bg-muted/30 cursor-pointer"
                        onClick={() => router.push(`/payments/${row.original.id}`)}
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

            {/* Pagination */}
            {listData?.pagination && listData.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {listData.pagination.total} {listData.pagination.total !== 1 ? t('transactions') : t('transaction')}
                  {search && ` ${t('matching')} "${search}"`}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    {t('Previous')}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {t('Page {currentPage} of {totalPages}', { currentPage: listData.pagination.page, totalPages: listData.pagination.totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= listData.pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t('Next')}
                  </Button>
                </div>
              </div>
            )}

            {!listLoading && (listData?.transactions?.length ?? 0) > 0 && !listData?.pagination && (
              <p className="text-sm text-muted-foreground">
                {listData?.transactions.length} {listData?.transactions.length !== 1 ? t('transactions') : t('transaction')}
                {search && ` ${t('matching')} "${search}"`}
              </p>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
