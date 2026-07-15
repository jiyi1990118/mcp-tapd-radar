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

/**
 * Unwrap a single-key TAPD wrapper object: `{ Story: {...} }` -> `{...}`.
 * Returns the input unchanged if it is not a single-key wrapper.
 */
export function unwrapTapdEntity(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length === 1 && record[keys[0]] && typeof record[keys[0]] === 'object') {
    return record[keys[0]];
  }
  return value;
}
