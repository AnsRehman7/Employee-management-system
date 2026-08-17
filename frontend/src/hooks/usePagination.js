import { useCallback, useEffect, useMemo, useState } from "react";

export const PAGE_SIZE = 10;

/**
 * Client-side paging for a list that is already loaded in full.
 * Clamps the current page whenever the collection shrinks.
 */
export const usePagination = (items, pageSize = PAGE_SIZE) => {
  const [page, setPage] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  const resetPage = useCallback(() => setPage(1), []);

  return {
    firstItem: total === 0 ? 0 : (page - 1) * pageSize + 1,
    lastItem: Math.min(page * pageSize, total),
    page,
    pageItems,
    pageSize,
    resetPage,
    setPage,
    total,
    totalPages,
  };
};
