import { describe, it, expect } from 'vitest';
import { convertDataToArray, pickDefined } from '../src/utils/helpers.js';

describe('convertDataToArray', () => {
  it('returns empty array for null', () => {
    expect(convertDataToArray(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(convertDataToArray(undefined as unknown as null)).toEqual([]);
  });

  it('converts object to array of values', () => {
    const data = { '1': { id: '1', name: 'A' }, '2': { id: '2', name: 'B' } };
    const result = convertDataToArray(data);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ id: '1', name: 'A' });
    expect(result).toContainEqual({ id: '2', name: 'B' });
  });
});

describe('pickDefined', () => {
  it('picks only defined values', () => {
    const source = { a: 'hello', b: undefined, c: 0, d: '' };
    const result = pickDefined(source, ['a', 'b', 'c', 'd']);
    expect(result).toEqual({ a: 'hello', c: 0, d: '' });
  });

  it('returns empty object when nothing defined', () => {
    const source = { a: undefined, b: undefined };
    const result = pickDefined(source, ['a', 'b']);
    expect(result).toEqual({});
  });

  it('ignores keys not in list', () => {
    const source = { a: '1', b: '2', c: '3' };
    const result = pickDefined(source, ['a']);
    expect(result).toEqual({ a: '1' });
  });
});
