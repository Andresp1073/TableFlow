'use client';

import { useMemo, useState } from 'react';

interface UsePaginationOptions {
  totalItems: number;
  pageSize?: number;
  initialPage?: number;
}

export function usePagination({ totalItems, pageSize = 20, initialPage = 1 }: UsePaginationOptions) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginationRange = useMemo(() => {
    const delta = 2;
    const range: (number | 'ellipsis')[] = [];
    const start = Math.max(2, safePage - delta);
    const end = Math.min(totalPages - 1, safePage + delta);

    range.push(1);
    if (start > 2) range.push('ellipsis');
    for (let i = start; i <= end; i++) range.push(i);
    if (end < totalPages - 1) range.push('ellipsis');
    if (totalPages > 1) range.push(totalPages);

    return range;
  }, [safePage, totalPages]);

  return {
    currentPage: safePage,
    totalPages,
    pageSize,
    totalItems,
    paginationRange,
    setPage: setCurrentPage,
    nextPage: () => setCurrentPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setCurrentPage((p) => Math.max(p - 1, 1)),
    canNext: safePage < totalPages,
    canPrev: safePage > 1,
    offset: (safePage - 1) * pageSize,
  };
}
