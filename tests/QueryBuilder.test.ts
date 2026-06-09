import { describe, it, expect } from 'vitest';
import { QueryBuilder } from '../src/api/QueryBuilder.js';

describe('QueryBuilder', () => {
  it('builds empty query', () => {
    const qb = new QueryBuilder();
    expect(qb.build()).toBe('');
  });

  it('adds basic params', () => {
    const qb = new QueryBuilder();
    qb.add('workspace_id', '123');
    expect(qb.build()).toContain('workspace_id=123');
  });

  it('skips undefined and empty values', () => {
    const qb = new QueryBuilder();
    qb.add('key', undefined);
    qb.add('key2', '');
    expect(qb.build()).toBe('');
  });

  it('adds LIKE operator', () => {
    const qb = new QueryBuilder();
    qb.addLike('name', 'test');
    expect(qb.build()).toContain('name=LIKE%3Ctest%3E');
  });

  it('adds LIKE_OR operator', () => {
    const qb = new QueryBuilder();
    qb.addLikeOr('name', ['foo', 'bar']);
    expect(qb.build()).toContain('name=LIKE_OR%3Cfoo%7Cbar%3E');
  });

  it('adds NOT_EQ operator', () => {
    const qb = new QueryBuilder();
    qb.addNotEq('status', 'closed');
    expect(qb.build()).toContain('status=NOT_EQ%3Cclosed%3E');
  });

  it('adds USER_OR operator', () => {
    const qb = new QueryBuilder();
    qb.addUserOr('owner', ['user1', 'user2']);
    expect(qb.build()).toContain('owner=USER_OR%3Cuser1%7Cuser2%3E');
  });

  it('adds enum OR', () => {
    const qb = new QueryBuilder();
    qb.addEnumOr('status', ['new', 'in_progress']);
    expect(qb.build()).toContain('status=new%7Cin_progress');
  });

  it('adds time range', () => {
    const qb = new QueryBuilder();
    qb.addTimeRange('created', '>2024-01-01');
    expect(qb.build()).toContain('created=%3E2024-01-01');
  });

  it('adds multi ID', () => {
    const qb = new QueryBuilder();
    qb.addMultiId('id', ['1', '2', '3']);
    expect(qb.build()).toContain('id=1%2C2%2C3');
  });

  it('adds fields', () => {
    const qb = new QueryBuilder();
    qb.addFields(['id', 'name', 'status']);
    expect(qb.build()).toContain('fields=id%2Cname%2Cstatus');
  });

  it('adds pagination with defaults', () => {
    const qb = new QueryBuilder();
    qb.addPagination(30, 1);
    expect(qb.build()).toContain('limit=30');
    expect(qb.build()).toContain('page=1');
  });

  it('caps limit at 200', () => {
    const qb = new QueryBuilder();
    qb.addPagination(500, 1);
    expect(qb.build()).toContain('limit=200');
  });

  it('floors page at 1', () => {
    const qb = new QueryBuilder();
    qb.addPagination(30, 0);
    expect(qb.build()).toContain('page=1');
  });

  it('resets params', () => {
    const qb = new QueryBuilder();
    qb.add('key', 'value');
    expect(qb.build()).not.toBe('');
    qb.reset();
    expect(qb.build()).toBe('');
  });

  it('chains multiple methods', () => {
    const qb = new QueryBuilder();
    qb.add('workspace_id', '123')
      .addLike('name', 'test')
      .addEnumOr('status', ['new', 'in_progress'])
      .addPagination(50, 2);

    const result = qb.build();
    expect(result).toContain('workspace_id=123');
    expect(result).toContain('name=LIKE%3Ctest%3E');
    expect(result).toContain('status=new%7Cin_progress');
    expect(result).toContain('limit=50');
    expect(result).toContain('page=2');
  });
});
