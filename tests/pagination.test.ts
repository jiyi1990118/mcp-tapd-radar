import { describe, it, expect } from 'vitest';
import { normalizePagination, fetchAllPages } from '../src/utils/pagination.js';

describe('normalizePagination', () => {
  it('returns defaults when no options', () => {
    const result = normalizePagination();
    expect(result.limit).toBe(30);
    expect(result.page).toBe(1);
  });

  it('returns provided values', () => {
    const result = normalizePagination({ limit: 50, page: 3 });
    expect(result.limit).toBe(50);
    expect(result.page).toBe(3);
  });

  it('caps limit at 200', () => {
    const result = normalizePagination({ limit: 500 });
    expect(result.limit).toBe(200);
  });

  it('floors page at 1', () => {
    const result = normalizePagination({ page: 0 });
    expect(result.page).toBe(1);
  });

  it('handles negative page', () => {
    const result = normalizePagination({ page: -5 });
    expect(result.page).toBe(1);
  });
});

describe('fetchAllPages', () => {
  it('fetches single page', async () => {
    const fetchFn = async (page: number, limit: number) => {
      return [{ id: 1, page, limit }];
    };
    const result = await fetchAllPages(fetchFn, 5);
    expect(result).toHaveLength(1);
  });

  it('fetches multiple pages', async () => {
    let callCount = 0;
    const fetchFn = async (_page: number, _limit: number) => {
      callCount++;
      if (callCount === 1) return Array(200).fill({ id: 1 });
      return Array(50).fill({ id: 2 });
    };
    const result = await fetchAllPages(fetchFn, 5);
    expect(result).toHaveLength(250);
    expect(callCount).toBe(2);
  });

  it('stops at maxPages', async () => {
    const fetchFn = async () => Array(200).fill({ id: 1 });
    const result = await fetchAllPages(fetchFn, 3);
    expect(result).toHaveLength(600);
  });
});
