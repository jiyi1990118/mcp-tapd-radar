import { describe, expect, it } from 'vitest';
import { buildEntitySummary, buildListResponse, buildOperationResponse, classifyToolError } from '../src/utils/response.js';

describe('buildEntitySummary', () => {
  it('keeps only important fields and trims empty values', () => {
    expect(buildEntitySummary('story', {
      id: '114',
      name: 'Increase price display',
      status: 'status_1',
      priority: '4',
      owner: 'Alice',
      iteration_id: '',
      description: '<div>desc&nbsp;line</div>',
      custom_field_one: 'foo',
    })).toEqual({
      entity_type: 'story',
      id: '114',
      name: 'Increase price display',
      status: 'status_1',
      priority: '4',
      owner: 'Alice',
      description: 'desc line',
    });
  });
});

describe('buildListResponse', () => {
  it('returns a compact list payload with count and items', () => {
    expect(buildListResponse({
      tool: 'tapd_list_stories',
      entityType: 'story',
      items: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }],
      filters: { status: 'new' },
      workspaceId: '48801209',
    })).toEqual({
      ok: true,
      tool: 'tapd_list_stories',
      summary: 'Found 2 story item(s).',
      data: {
        items: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }],
        count: 2,
      },
      context: {
        workspace_id: '48801209',
        entity_type: 'story',
        filters: { status: 'new' },
      },
    });
  });
});

describe('buildOperationResponse', () => {
  it('summarizes a single entity mutation', () => {
    expect(buildOperationResponse({
      tool: 'tapd_create_story',
      action: 'created',
      entityType: 'story',
      item: { id: '114', name: 'Increase price display', status: 'new' },
      workspaceId: '48801209',
    })).toEqual({
      ok: true,
      tool: 'tapd_create_story',
      summary: 'Created story: Increase price display (id: 114).',
      data: {
        item: { id: '114', name: 'Increase price display', status: 'new' },
      },
      context: {
        workspace_id: '48801209',
        entity_type: 'story',
        action: 'created',
      },
    });
  });
});

describe('classifyToolError', () => {
  it('maps permission failures to actionable output', () => {
    expect(classifyToolError(new Error('You are not allowed to access this api , scope limited'))).toEqual({
      type: 'permission',
      retryable: false,
      suggestion: 'Check TAPD Open Platform app permissions for the requested module or scope.',
    });
  });
});
