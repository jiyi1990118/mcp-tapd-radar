export interface PaginationOptions {
  limit?: number;
  page?: number;
}

export const DEFAULT_PAGE_SIZE = 30;
export const MAX_PAGE_SIZE = 200;

export function normalizePagination(options?: PaginationOptions): { limit: number; page: number } {
  return {
    limit: Math.min(options?.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
    page: Math.max(options?.page ?? 1, 1),
  };
}

export async function fetchAllPages<T>(
  fetchFn: (page: number, limit: number) => Promise<T[]>,
  maxPages: number = 20,
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 1;
  const limit = MAX_PAGE_SIZE;

  while (page <= maxPages) {
    const items = await fetchFn(page, limit);
    allItems.push(...items);
    if (items.length < limit) break;
    page++;
  }

  return allItems;
}
