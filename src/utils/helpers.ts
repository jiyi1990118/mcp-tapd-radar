export function convertDataToArray(data: Record<string, unknown> | null): unknown[] {
  if (!data) return [];
  return Object.values(data);
}

export function pickDefined<T extends Record<string, unknown>>(
  source: T,
  keys: string[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}
